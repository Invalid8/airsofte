import { Router, Request, Response } from "express";
import { GeminiService } from "../services/gemini.service";
import type {
  GenerateMissionRequest,
  TacticalHintRequest,
  MissionReportRequest,
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

      console.log("Generating mission:", params);

      const mission = await geminiService.generateMission(params);

      res.json({
        success: true,
        data: mission,
        timestamp: Date.now(),
      } as ApiResponse);
    } catch (error: any) {
      console.error("Mission generation error:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to generate mission",
        timestamp: Date.now(),
      } as ApiResponse);
    }
  });

  router.post("/tactical-hint", async (req: Request, res: Response) => {
    try {
      const params: TacticalHintRequest = req.body;

      if (
        typeof params.playerHealth !== "number" ||
        !Array.isArray(params.enemyTypes) ||
        !params.playerWeapon ||
        typeof params.waveNumber !== "number"
      ) {
        res.status(400).json({
          success: false,
          error: "Invalid parameters",
          timestamp: Date.now(),
        } as ApiResponse);
        return;
      }

      console.log("Generating tactical hint:", params);

      const hint = await geminiService.getTacticalHint(params);

      res.json({
        success: true,
        data: { hint },
        timestamp: Date.now(),
      } as ApiResponse);
    } catch (error: any) {
      console.error("Tactical hint error:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to generate hint",
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

      console.log(
        "Generating mission report:",
        params.missionName,
        params.outcome,
      );

      const report = await geminiService.generateMissionReport(params);

      res.json({
        success: true,
        data: { report },
        timestamp: Date.now(),
      } as ApiResponse);
    } catch (error: any) {
      console.error("Mission report error:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to generate report",
        timestamp: Date.now(),
      } as ApiResponse);
    }
  });

  return router;
}
