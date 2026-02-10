import { GoogleGenerativeAI } from "@google/generative-ai";
import type {
  GenerateMissionRequest,
  GeneratedMission,
  EnhancedTacticalHintRequest,
  MissionReportRequest,
  GameEventCommentaryRequest,
} from "../types";

type SessionContext = {
  recentEvents: string[];
  playerStyle: string;
  lastCommentaryTime: number;
  lastActivity: number;
};

export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: any;
  private textModel: any;
  private readonly MAX_RETRIES = 3;
  private readonly INITIAL_RETRY_DELAY = 1000;
  private readonly SESSION_TIMEOUT = 30 * 60 * 1000;
  private sessionContexts: Map<string, SessionContext> = new Map();
  private readonly PRIMARY_MODEL: string;
  private readonly FALLBACK_MODELS: string[];
  private readonly TEXT_MODEL: string;
  private readonly TEXT_FALLBACK_MODELS: string[];

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);

    this.PRIMARY_MODEL = process.env.GEMINI_PRIMARY_MODEL || "gemini-3-flash-preview";
    this.FALLBACK_MODELS = process.env.GEMINI_FALLBACK_MODELS
      ? process.env.GEMINI_FALLBACK_MODELS.split(",")
      : ["gemini-3-pro-preview"];

    this.TEXT_MODEL = process.env.GEMINI_TEXT_MODEL || "gemini-3-flash-preview";
    this.TEXT_FALLBACK_MODELS = process.env.GEMINI_TEXT_FALLBACK_MODELS
      ? process.env.GEMINI_TEXT_FALLBACK_MODELS.split(",")
      : ["gemini-3-pro-preview"];

    this.model = this.genAI.getGenerativeModel({
      model: this.PRIMARY_MODEL,
      generationConfig: {
        temperature: 0.9,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
        responseMimeType: "application/json",
      },
    });

    this.textModel = this.genAI.getGenerativeModel({
      model: this.TEXT_MODEL,
      generationConfig: {
        temperature: 0.9,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
        responseMimeType: "text/plain",
      },
    });

    setInterval(() => this.cleanupExpiredSessions(), 5 * 60 * 1000);
  }

  private async retryWithBackoff<T>(
    operation: () => Promise<T>,
    retryCount: number = 0,
  ): Promise<T> {
    try {
      return await operation();
    } catch (error: any) {
      if (error.status === 429 && retryCount < this.MAX_RETRIES) {
        const delay = this.INITIAL_RETRY_DELAY * Math.pow(2, retryCount);
        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.retryWithBackoff(operation, retryCount + 1);
      }
      throw error;
    }
  }

  private async executeWithFallback<T>(
    operation: (model: any) => Promise<T>,
    modelType: "json" | "text" = "json",
  ): Promise<T> {
    const models =
      modelType === "json"
        ? [this.PRIMARY_MODEL, ...this.FALLBACK_MODELS]
        : [this.TEXT_MODEL, ...this.TEXT_FALLBACK_MODELS];

    let lastError: Error | null = null;

    for (let i = 0; i < models.length; i++) {
      try {
        const model = this.genAI.getGenerativeModel({
          model: models[i],
          generationConfig:
            modelType === "json"
              ? {
                  temperature: 0.9,
                  topK: 40,
                  topP: 0.95,
                  maxOutputTokens: 8192,
                  responseMimeType: "application/json",
                }
              : {
                  temperature: 0.9,
                  topK: 40,
                  topP: 0.95,
                  maxOutputTokens: 2048,
                  responseMimeType: "text/plain",
                },
        });

        return await operation(model);
      } catch (error: any) {
        lastError = error;
        if (i < models.length - 1) {
          console.warn(`Model ${models[i]} failed, trying ${models[i + 1]}...`);
          continue;
        }
      }
    }

    throw lastError || new Error("All models failed");
  }

  async generateMission(
    params: GenerateMissionRequest,
  ): Promise<GeneratedMission> {
    const { difficulty, theme, waveCount } = params;

    const enemyRanges = {
      Easy: { min: 4, max: 6 },
      Normal: { min: 7, max: 10 },
      Hard: { min: 11, max: 15 },
    };
    const range = enemyRanges[difficulty];

    const prompt = `Generate a space shooter mission with these parameters:
- Difficulty: ${difficulty}
- Theme: ${theme || "generic space combat"}
- Number of waves: ${waveCount}

CRITICAL CONSTRAINTS:
- Enemy types: BASIC, SCOUT, BOMBER only (NO BOSS)
- Patterns: STRAIGHT, WAVE, ZIGZAG, CIRCLE, CHASE, TELEPORT only
- Objective types: DESTROY, SURVIVE, COLLECT, COMBO only
- Dialogue timing: START, MID, END
- Wave count must be exactly ${waveCount}
- spawnDelay: 500-1200ms
- spawnInterval: 800-1500ms
- Include 2-3 objectives
- Include exactly 3 dialogue entries (one START, one MID, one END)
- Make the mission thematic and engaging based on "${theme || "space combat"}"

ENEMY COUNT PER WAVE (MOST IMPORTANT):
For difficulty ${difficulty}, EACH wave must have between ${range.min} and ${range.max} TOTAL enemies.
This is the sum of ALL enemy counts in a wave.
Example for ${difficulty}:
- Wave with 3 BASIC (count: 2) + 2 SCOUT (count: 3) = 5 TOTAL (INVALID if < ${range.min})
- Wave with 2 BASIC (count: 3) + 1 SCOUT (count: 5) = 8 TOTAL (VALID for ${difficulty})
- Wave with 1 BASIC (count: ${range.min}) = ${range.min} TOTAL (VALID)
DO NOT exceed ${range.max} total enemies per wave!

Return a JSON object with this structure:
{
  "title": "string (exciting mission name, 2-4 words)",
  "description": "string (brief mission briefing, 1-2 sentences)",
  "objectives": [
    {
      "type": "DESTROY|SURVIVE|COLLECT|COMBO",
      "target": number,
      "description": "string"
    }
  ],
  "waves": [
    {
      "enemies": [
        {
          "type": "BASIC|SCOUT|BOMBER",
          "count": number,
          "pattern": "STRAIGHT|WAVE|ZIGZAG|CIRCLE|CHASE|TELEPORT",
          "spawnDelay": number
        }
      ],
      "spawnInterval": number
    }
  ],
  "dialogue": [
    {
      "character": "string",
      "text": "string",
      "timing": "START|MID|END"
    }
  ]
}`;

    try {
      const mission = await this.retryWithBackoff(async () => {
        return await this.executeWithFallback(async (model) => {
          const result = await model.generateContent(prompt);
          const response = result.response.text();

          let cleanResponse = response.trim();

          if (cleanResponse.startsWith("```")) {
            cleanResponse = cleanResponse
              .replace(/```json\n?|\n?```/g, "")
              .replace(/```\n?|\n?```/g, "")
              .trim();
          }

          const firstBrace = cleanResponse.indexOf("{");
          const lastBrace = cleanResponse.lastIndexOf("}");
          if (firstBrace !== -1 && lastBrace !== -1 && firstBrace < lastBrace) {
            cleanResponse = cleanResponse.substring(firstBrace, lastBrace + 1);
          }

          let parsedMission;
          try {
            parsedMission = JSON.parse(cleanResponse);
          } catch (parseError: any) {
            throw new Error(
              `Invalid JSON from AI: ${parseError.message}. The response may have been truncated. Please try again.`,
            );
          }

          this.validateMission(parsedMission, params);

          return parsedMission;
        }, "json");
      });

      return mission;
    } catch (error: any) {
      if (error.status === 429) {
        throw new Error(
          "API rate limit exceeded. Please try again in a few moments.",
        );
      }

      throw new Error(`Failed to generate mission: ${error.message}`);
    }
  }

  private validateMission(mission: any, params: GenerateMissionRequest): void {
    if (!mission.title || !mission.description) {
      throw new Error("Mission must have title and description");
    }

    if (!Array.isArray(mission.objectives) || mission.objectives.length === 0) {
      throw new Error("Mission must have objectives");
    }

    if (!Array.isArray(mission.waves) || mission?.waves?.length === 0) {
      throw new Error("Mission must have waves");
    }

    if (mission.waves.length !== params.waveCount) {
      throw new Error(
        `Wave count mismatch: expected ${params.waveCount}, got ${mission.waves.length}`,
      );
    }

    if (!Array.isArray(mission.dialogue) || mission.dialogue.length !== 3) {
      throw new Error("Mission must have exactly 3 dialogue entries");
    }

    const validEnemyTypes = ["BASIC", "SCOUT", "BOMBER"];
    const validPatterns = [
      "STRAIGHT",
      "WAVE",
      "ZIGZAG",
      "CIRCLE",
      "CHASE",
      "TELEPORT",
    ];
    const validObjectiveTypes = ["DESTROY", "SURVIVE", "COLLECT", "COMBO"];
    const validTimings = ["START", "MID", "END"];

    const difficultyRanges = {
      Easy: { min: 4, max: 6 },
      Normal: { min: 7, max: 10 },
      Hard: { min: 11, max: 15 },
    };

    const range = difficultyRanges[params.difficulty];

    mission?.waves?.forEach((wave: any, waveIndex: number) => {
      if (!Array.isArray(wave.enemies)) {
        throw new Error(`Wave ${waveIndex + 1} must have enemies array`);
      }

      let totalEnemies = 0;

      wave.enemies.forEach((enemy: any, enemyIndex: number) => {
        if (!validEnemyTypes.includes(enemy.type)) {
          throw new Error(
            `Wave ${waveIndex + 1}, Enemy ${enemyIndex + 1}: Invalid enemy type "${enemy.type}"`,
          );
        }
        if (!validPatterns.includes(enemy.pattern)) {
          throw new Error(
            `Wave ${waveIndex + 1}, Enemy ${enemyIndex + 1}: Invalid pattern "${enemy.pattern}"`,
          );
        }
        if (typeof enemy.count !== "number" || enemy.count < 1) {
          throw new Error(
            `Wave ${waveIndex + 1}, Enemy ${enemyIndex + 1}: Invalid count`,
          );
        }
        if (typeof enemy.spawnDelay !== "number") {
          throw new Error(
            `Wave ${waveIndex + 1}, Enemy ${enemyIndex + 1}: Invalid spawnDelay`,
          );
        }

        totalEnemies += enemy.count;
      });

      if (totalEnemies < range.min || totalEnemies > range.max) {
        throw new Error(
          `Wave ${waveIndex + 1}: Total enemies (${totalEnemies}) outside ${params.difficulty} range (${range.min}-${range.max})`,
        );
      }

      if (typeof wave.spawnInterval !== "number") {
        throw new Error(`Wave ${waveIndex + 1}: Invalid spawnInterval`);
      }
    });

    mission.objectives.forEach((objective: any, index: number) => {
      if (!validObjectiveTypes.includes(objective.type)) {
        throw new Error(
          `Objective ${index + 1}: Invalid type "${objective.type}"`,
        );
      }
      if (typeof objective.target !== "number") {
        throw new Error(`Objective ${index + 1}: Invalid target`);
      }
      if (!objective.description) {
        throw new Error(`Objective ${index + 1}: Missing description`);
      }
    });

    const timingsFound = new Set<string>();
    mission.dialogue.forEach((dialogue: any, index: number) => {
      if (!dialogue.character || !dialogue.text) {
        throw new Error(`Dialogue ${index + 1}: Missing character or text`);
      }
      if (!validTimings.includes(dialogue.timing)) {
        throw new Error(
          `Dialogue ${index + 1}: Invalid timing "${dialogue.timing}"`,
        );
      }
      timingsFound.add(dialogue.timing);
    });

    if (
      !timingsFound.has("START") ||
      !timingsFound.has("MID") ||
      !timingsFound.has("END")
    ) {
      throw new Error("Dialogue must include START, MID, and END timings");
    }
  }

  async getEnhancedTacticalHint(
    params: EnhancedTacticalHintRequest,
  ): Promise<string> {
    const {
      playerHealth,
      enemyTypes,
      playerWeapon,
      waveNumber,
      comboMultiplier,
      activePowerUps,
      sessionId,
    } = params;

    const context = this.getOrCreateSessionContext(sessionId);

    const prompt = `You are an elite tactical advisor in a fast-paced space shooter.

CURRENT BATTLE STATUS:
- Health: ${playerHealth}/100 ${playerHealth < 30 ? "⚠️ CRITICAL" : playerHealth < 60 ? "⚠️ LOW" : ""}
- Enemies: ${enemyTypes.join(", ")}
- Weapon: ${playerWeapon}
- Wave: ${waveNumber}
- Combo: ${comboMultiplier || 0}x ${(comboMultiplier || 0) >= 3 ? "🔥 ON FIRE!" : ""}
- Active Powers: ${activePowerUps?.join(", ") || "None"}

PLAYER STYLE: ${context.playerStyle}
RECENT EVENTS: ${context.recentEvents.slice(-3).join("; ")}

Provide ONE tactical tip (8-12 words max).
Be urgent, specific, and match the intensity of the situation.
Return ONLY the tip text.

Examples:
- "Combo active! Chain kills now for massive points!"
- "Critical health! Dodge and grab that health pack!"
- "Triple weapon ready! Unleash on that bomber!"`;

    try {
      const hint = await this.retryWithBackoff(async () => {
        return await this.executeWithFallback(async (model) => {
          const result = await model.generateContent(prompt);
          const response = result.response.text().trim();

          context.recentEvents.push(`Hint given: ${response}`);
          if (context.recentEvents.length > 10) {
            context.recentEvents.shift();
          }
          context.lastActivity = Date.now();

          return response.substring(0, 100);
        }, "text");
      });

      return hint;
    } catch (error: any) {
      throw new Error(`Failed to generate hint: ${error.message}`);
    }
  }

  async generateGameCommentary(
    params: GameEventCommentaryRequest,
  ): Promise<string> {
    const { eventType, context, sessionId } = params;

    const sessionContext = this.getOrCreateSessionContext(sessionId);
    const now = Date.now();

    if (now - sessionContext.lastCommentaryTime < 2000) {
      throw new Error("THROTTLED");
    }

    const eventPrompts = {
      COMBO: `Player achieved ${context.comboMultiplier || 0}x combo! Generate ONE hype reaction (8-12 words max). Make it EXCITING and celebratory!`,

      NEAR_DEATH: `Player at ${context.playerHealth || 0}% health! Generate ONE urgent warning (8-12 words max). Make it TENSE!`,

      BOSS_SPAWN: `Boss "${context.bossName || "Unknown"}" appeared! Generate ONE dramatic announcement (8-12 words max). Make it EPIC!`,

      BOSS_DEFEAT: `Boss defeated with player at ${context.playerHealth || 0}% health! Generate ONE victory celebration (8-12 words max). Make it TRIUMPHANT!`,

      EPIC_KILL: `Player destroyed ${context.enemiesDefeated || 0} enemies in quick succession! Generate ONE amazed reaction (8-12 words max). Make it IMPRESSED!`,

      WAVE_COMPLETE: `Wave ${context.waveNumber || 0} complete! Generate ONE encouraging comment (8-12 words max). Keep momentum!`,

      POWER_UP: `Player grabbed ${context.powerUpType || "power-up"}! Generate ONE excited reaction (8-12 words max). Make it PUMPED!`,

      PERFECT_WAVE: `Perfect wave! No damage taken! Generate ONE congratulatory comment (8-12 words max). Make it PROUD!`,
    };

    const prompt = `You are an energetic sports commentator for a space shooter game.

EVENT: ${eventType}
${eventPrompts[eventType]}

RECENT CONTEXT: ${sessionContext.recentEvents.slice(-2).join("; ")}

Return ONLY the commentary text. No quotes, no formatting.
Use emojis sparingly (max 1-2).
Be enthusiastic, natural, and varied.

Examples:
- "INSANE! Five enemies eliminated in three seconds! 🔥"
- "That was TOO CLOSE! One more hit and it's over!"
- "LEGENDARY move right there! Ace piloting at its finest!"`;

    try {
      const commentary = await this.retryWithBackoff(async () => {
        return await this.executeWithFallback(async (model) => {
          const result = await model.generateContent(prompt);
          const response = result.response.text().trim();

          sessionContext.recentEvents.push(`${eventType}: ${response}`);
          if (sessionContext.recentEvents.length > 8) {
            sessionContext.recentEvents.shift();
          }
          sessionContext.lastCommentaryTime = now;
          sessionContext.lastActivity = now;

          this.updatePlayerStyle(sessionContext, eventType, context);

          return response.substring(0, 120);
        }, "text");
      });

      return commentary;
    } catch (error: any) {
      throw new Error(`Failed to generate commentary: ${error.message}`);
    }
  }

  private getOrCreateSessionContext(sessionId: string): SessionContext {
    if (!this.sessionContexts.has(sessionId)) {
      this.sessionContexts.set(sessionId, {
        recentEvents: [],
        playerStyle: "balanced",
        lastCommentaryTime: 0,
        lastActivity: Date.now(),
      });
    }
    const context = this.sessionContexts.get(sessionId)!;
    context.lastActivity = Date.now();
    return context;
  }

  private updatePlayerStyle(
    context: SessionContext,
    eventType: string,
    eventContext: any,
  ): void {
    if (eventType === "COMBO" && (eventContext.comboMultiplier || 0) >= 5) {
      context.playerStyle = "aggressive";
      return;
    }

    if (eventType === "NEAR_DEATH") {
      context.playerStyle = "risky";
      return;
    }

    if (eventType === "PERFECT_WAVE") {
      context.playerStyle = "skilled";
      return;
    }

    const comboEvents = context.recentEvents.filter((e) =>
      e.startsWith("COMBO:"),
    ).length;
    const nearDeathEvents = context.recentEvents.filter((e) =>
      e.startsWith("NEAR_DEATH:"),
    ).length;

    if (comboEvents > 3) {
      context.playerStyle = "aggressive";
    } else if (nearDeathEvents > 2) {
      context.playerStyle = "risky";
    } else if ((eventContext.comboMultiplier || 0) >= 3) {
      context.playerStyle = "skilled";
    } else {
      context.playerStyle = "tactical";
    }
  }

  hasSession(sessionId: string): boolean {
    return this.sessionContexts.has(sessionId);
  }

  cleanupSession(sessionId: string): void {
    this.sessionContexts.delete(sessionId);
  }

  private cleanupExpiredSessions(): void {
    const now = Date.now();
    for (const [sessionId, context] of this.sessionContexts.entries()) {
      if (now - context.lastActivity > this.SESSION_TIMEOUT) {
        this.sessionContexts.delete(sessionId);
      }
    }
  }

  async generateMissionReport(params: MissionReportRequest): Promise<string> {
    const {
      missionName,
      outcome,
      score,
      enemiesDefeated,
      damageTaken,
      previousReports,
    } = params;

    const now = new Date();
    const timestamp = now.toISOString().replace("T", " ").substring(0, 19);
    const callsign = `ALPHA-${Math.floor(Math.random() * 900 + 100)}`;

    const prompt = `Write a military-style mission debriefing report for a space combat simulator.

MISSION DATA:
- Name: ${missionName}
- Result: ${outcome.toUpperCase()}
- Final Score: ${score.toLocaleString()} points
- Enemies Neutralized: ${enemiesDefeated}
- Hull Damage: ${damageTaken} HP
- Timestamp: ${timestamp}
- Pilot Callsign: ${callsign}

${
  previousReports && previousReports.length > 0
    ? `PREVIOUS OPERATIONS:\n${previousReports.slice(-2).join("\n\n")}\n\nNote: Continue the ongoing narrative. Reference the pilot's progression.`
    : "Note: This is the pilot's first combat sortie."
}

INSTRUCTIONS:
- Write 120-160 words
- Use the actual timestamp: ${timestamp}
- Use the actual callsign: ${callsign}
- Structure: 
  1. Mission header with actual name and outcome
  2. Performance summary with actual stats
  3. Tactical assessment (2-3 sentences)
  4. ${outcome === "victory" ? "Commendation and next steps" : "Constructive feedback and encouragement"}
  5. Proper military closing

- Style: Formal military report, engaging and immersive
- Tone: ${outcome === "victory" ? "Professional with subtle pride" : "Professional and constructive"}
- Use military terms: sortie, engagement, neutralized, sustained, operational period
- End with: COMMAND OUT

CRITICAL: Return ONLY the complete report text. No JSON, no code blocks, no markdown, no quotes. Use the actual values provided above, not placeholders. The report must be COMPLETE with proper ending.`;

    try {
      const report = await this.executeWithFallback(async (model) => {
        const result = await model.generateContent(prompt);
        const response = result.response.text().trim();

        let cleanReport = response;

        if (cleanReport.includes("```")) {
          cleanReport = cleanReport
            .replace(/```[a-z]*\n?/g, "")
            .replace(/```/g, "")
            .trim();
        }

        if (
          (cleanReport.startsWith('"') && cleanReport.endsWith('"')) ||
          (cleanReport.startsWith("'") && cleanReport.endsWith("'"))
        ) {
          cleanReport = cleanReport.slice(1, -1);
        }

        return cleanReport.substring(0, 1000);
      }, "text");

      return report;
    } catch (error: any) {
      throw new Error(`Failed to generate report: ${error.message}`);
    }
  }
}
