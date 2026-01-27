import { GoogleGenerativeAI } from "@google/generative-ai";
import type {
  GenerateMissionRequest,
  GeneratedMission,
  TacticalHintRequest,
  MissionReportRequest,
} from "../types";

export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: any;
  private readonly MAX_RETRIES = 3;
  private readonly INITIAL_RETRY_DELAY = 1000;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.9,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
        responseMimeType: "application/json",
      },
    });
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
        console.log(
          `Rate limit hit, retrying in ${delay}ms (attempt ${retryCount + 1}/${this.MAX_RETRIES})`,
        );

        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.retryWithBackoff(operation, retryCount + 1);
      }
      throw error;
    }
  }

  async generateMission(
    params: GenerateMissionRequest,
  ): Promise<GeneratedMission> {
    const { difficulty, theme, waveCount } = params;

    const prompt = `Generate a space shooter mission with these parameters:
- Difficulty: ${difficulty}
- Theme: ${theme || "generic space combat"}
- Number of waves: ${waveCount}

Generate a mission following this exact structure with these rules:

CONSTRAINTS:
- Enemy types: BASIC, SCOUT, BOMBER (never BOSS unless explicitly requested)
- Patterns: STRAIGHT, WAVE, ZIGZAG, CIRCLE, CHASE, TELEPORT
- Objective types: DESTROY, SURVIVE, COLLECT, COMBO
- Dialogue timing: START, MID, END
- Wave count must be exactly ${waveCount}
- For ${difficulty}: Easy = 4-6 enemies per wave, Normal = 6-10, Hard = 10-15
- spawnDelay: 500-1200ms
- spawnInterval: 800-1500ms
- Include 2-3 objectives
- Include exactly 3 dialogue entries (one START, one MID, one END)
- Make the mission thematic and engaging based on "${theme || "space combat"}"

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
        const result = await this.model.generateContent(prompt);
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
          console.error("JSON parse error. Full response:", response);
          console.error("Cleaned response:", cleanResponse);
          throw new Error(
            `Invalid JSON from AI: ${parseError.message}. The response may have been truncated. Please try again.`,
          );
        }

        this.validateMission(parsedMission);

        return parsedMission;
      });

      return mission;
    } catch (error: any) {
      console.error("Mission generation error:", error);

      if (error.status === 429) {
        throw new Error(
          "API rate limit exceeded. Please try again in a few moments.",
        );
      }

      throw new Error(`Failed to generate mission: ${error.message}`);
    }
  }

  private validateMission(mission: any): void {
    if (!mission.title || !mission.description) {
      throw new Error("Mission must have title and description");
    }

    if (!Array.isArray(mission.objectives) || mission.objectives.length === 0) {
      throw new Error("Mission must have objectives");
    }

    if (!Array.isArray(mission.waves) || mission.waves.length === 0) {
      throw new Error("Mission must have waves");
    }

    if (!Array.isArray(mission.dialogue)) {
      throw new Error("Mission must have dialogue");
    }

    const validEnemyTypes = ["BASIC", "SCOUT", "BOMBER", "BOSS"];
    const validPatterns = [
      "STRAIGHT",
      "WAVE",
      "ZIGZAG",
      "CIRCLE",
      "CHASE",
      "TELEPORT",
      "SPIRAL",
      "DIAGONAL",
    ];
    const validObjectiveTypes = [
      "DESTROY",
      "SURVIVE",
      "PROTECT",
      "COLLECT",
      "NO_DAMAGE",
      "COMBO",
    ];
    const validTimings = ["START", "MID", "END"];

    mission.waves.forEach((wave: any, waveIndex: number) => {
      if (!Array.isArray(wave.enemies)) {
        throw new Error(`Wave ${waveIndex + 1} must have enemies array`);
      }

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
      });

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

    mission.dialogue.forEach((dialogue: any, index: number) => {
      if (!dialogue.character || !dialogue.text) {
        throw new Error(`Dialogue ${index + 1}: Missing character or text`);
      }
      if (!validTimings.includes(dialogue.timing)) {
        throw new Error(
          `Dialogue ${index + 1}: Invalid timing "${dialogue.timing}"`,
        );
      }
    });
  }

  async getTacticalHint(params: TacticalHintRequest): Promise<string> {
    const { playerHealth, enemyTypes, playerWeapon, waveNumber } = params;

    const prompt = `You are a tactical advisor in a space combat game.

Current situation:
- Player Health: ${playerHealth}/100
- Facing: ${enemyTypes.join(", ")}
- Current Weapon: ${playerWeapon}
- Wave: ${waveNumber}

Provide ONE tactical tip (maximum 12 words).
Be encouraging, specific, and actionable.
Return ONLY the tip text, no quotes, no formatting, no explanation.

Examples:
- "Focus fire on scouts first, they're fast"
- "Stay mobile, bombers are slow but deadly"
- "Collect health power-ups when health below 50"`;

    try {
      const hint = await this.retryWithBackoff(async () => {
        const result = await this.model.generateContent(prompt);
        return result.response.text().trim().substring(0, 100);
      });

      return hint;
    } catch (error: any) {
      console.error("Tactical hint error:", error);

      if (error.status === 429) {
        throw new Error("API rate limit exceeded. Please try again shortly.");
      }

      throw new Error(`Failed to generate hint: ${error.message}`);
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

    const prompt = `Write a military-style mission debriefing report.

Mission Details:
- Mission: ${missionName}
- Outcome: ${outcome.toUpperCase()}
- Score: ${score.toLocaleString()}
- Enemies Neutralized: ${enemiesDefeated}
- Damage Sustained: ${damageTaken} HP

${
  previousReports && previousReports.length > 0
    ? `
Previous Mission Context:
${previousReports.slice(-2).join("\n\n")}

Continue the narrative thread from previous missions.
`
    : "This is the pilot's first mission."
}

Requirements:
- 80-120 words maximum
- Military sci-fi style (formal but engaging)
- Include tactical assessment
- Reference pilot's performance
- ${outcome === "victory" ? "Commend success and hint at future challenges" : "Acknowledge setback and encourage improvement"}
- Make it immersive and story-driven
- Return ONLY the report text, no title, no formatting`;

    try {
      const result = await this.model.generateContent(prompt);
      const report = result.response.text().trim();

      return report.substring(0, 500);
    } catch (error: any) {
      console.error("Mission report error:", error);
      throw new Error(`Failed to generate report: ${error.message}`);
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const result = await this.model.generateContent('Respond with "OK"');
      const text = result.response.text();
      return text.includes("OK");
    } catch {
      return false;
    }
  }
}