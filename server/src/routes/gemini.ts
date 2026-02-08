import { Router, Request, Response } from "express";
import { GeminiService } from "../services/gemini.service";
import type {
  GenerateMissionRequest,
  EnhancedTacticalHintRequest,
  MissionReportRequest,
  GameEventCommentaryRequest,
  ApiResponse,
} from "../types";

export function createGeminiRouter(geminiService: GeminiService): Router {
  const router = Router();

  router.post("/generate-mission", async (req: Request, res: Response) => {
    try {
      const params: GenerateMissionRequest = req.body;

      if (!params.difficulty || !params.waveCount) {
        res.status(400).json({
          success: false,
          error: "Missing required parameters: difficulty, waveCount",
          timestamp: Date.now(),
        } as ApiResponse);
        return;
      }

      if (params.waveCount < 2 || params.waveCount > 10) {
        res.status(400).json({
          success: false,
          error: "waveCount must be between 2 and 10",
          timestamp: Date.now(),
        } as ApiResponse);
        return;
      }

      if (!["Easy", "Normal", "Hard"].includes(params.difficulty)) {
        res.status(400).json({
          success: false,
          error: "difficulty must be Easy, Normal, or Hard",
          timestamp: Date.now(),
        } as ApiResponse);
        return;
      }

      const mission = await geminiService.generateMission(params);

      res.json({
        success: true,
        data: mission,
        timestamp: Date.now(),
      } as ApiResponse);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || "Failed to generate mission",
        timestamp: Date.now(),
      } as ApiResponse);
    }
  });

  router.post("/tactical-hint", async (req: Request, res: Response) => {
    try {
      const params: EnhancedTacticalHintRequest = req.body;

      if (
        typeof params.playerHealth !== "number" ||
        !Array.isArray(params.enemyTypes) ||
        !params.playerWeapon ||
        typeof params.waveNumber !== "number" ||
        !params.sessionId
      ) {
        res.status(400).json({
          success: false,
          error: "Invalid parameters",
          timestamp: Date.now(),
        } as ApiResponse);
        return;
      }

      const hint = await geminiService.getEnhancedTacticalHint(params);

      res.json({
        success: true,
        data: { hint },
        timestamp: Date.now(),
      } as ApiResponse);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || "Failed to generate hint",
        timestamp: Date.now(),
      } as ApiResponse);
    }
  });

  router.post("/commentary", async (req: Request, res: Response) => {
    try {
      const params: GameEventCommentaryRequest = req.body;

      if (!params.eventType || !params.context || !params.sessionId) {
        res.status(400).json({
          success: false,
          error: "Missing required parameters: eventType, context, sessionId",
          timestamp: Date.now(),
        } as ApiResponse);
        return;
      }

      const validEvents = [
        "COMBO",
        "NEAR_DEATH",
        "BOSS_SPAWN",
        "BOSS_DEFEAT",
        "EPIC_KILL",
        "WAVE_COMPLETE",
        "POWER_UP",
        "PERFECT_WAVE",
      ];

      if (!validEvents.includes(params.eventType)) {
        res.status(400).json({
          success: false,
          error: `Invalid eventType. Must be one of: ${validEvents.join(", ")}`,
          timestamp: Date.now(),
        } as ApiResponse);
        return;
      }

      try {
        const commentary = await geminiService.generateGameCommentary(params);

        res.json({
          success: true,
          data: { commentary },
          timestamp: Date.now(),
        } as ApiResponse);
      } catch (error: any) {
        if (error.message === "THROTTLED") {
          res.json({
            success: true,
            data: { commentary: "", throttled: true },
            timestamp: Date.now(),
          } as ApiResponse);
          return;
        }
        throw error;
      }
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || "Failed to generate commentary",
        timestamp: Date.now(),
      } as ApiResponse);
    }
  });

  router.post("/mission-report", async (req: Request, res: Response) => {
    try {
      const params: MissionReportRequest = req.body;

      if (
        !params.missionName ||
        !params.outcome ||
        typeof params.score !== "number" ||
        typeof params.enemiesDefeated !== "number" ||
        typeof params.damageTaken !== "number"
      ) {
        res.status(400).json({
          success: false,
          error: "Invalid parameters",
          timestamp: Date.now(),
        } as ApiResponse);
        return;
      }

      if (!["victory", "defeat"].includes(params.outcome)) {
        res.status(400).json({
          success: false,
          error: "outcome must be victory or defeat",
          timestamp: Date.now(),
        } as ApiResponse);
        return;
      }

      const report = await geminiService.generateMissionReport(params);

      res.json({
        success: true,
        data: { report },
        timestamp: Date.now(),
      } as ApiResponse);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || "Failed to generate report",
        timestamp: Date.now(),
      } as ApiResponse);
    }
  });

  router.delete("/session/:sessionId", async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params;

      if (!sessionId || typeof sessionId !== "string") {
        res.status(400).json({
          success: false,
          error: "sessionId is required",
          timestamp: Date.now(),
        } as ApiResponse);
        return;
      }

      if (!geminiService.hasSession(sessionId)) {
        res.status(404).json({
          success: false,
          error: "Session not found",
          timestamp: Date.now(),
        } as ApiResponse);
        return;
      }

      geminiService.cleanupSession(sessionId);

      res.json({
        success: true,
        data: { message: "Session cleaned up" },
        timestamp: Date.now(),
      } as ApiResponse);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || "Failed to cleanup session",
        timestamp: Date.now(),
      } as ApiResponse);
    }
  });

  return router;
}
