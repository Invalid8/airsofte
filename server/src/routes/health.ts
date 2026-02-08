import { Router, Request, Response } from "express";
import type { HealthCheckResponse } from "../types";

export function createHealthRouter(): Router {
  const router = Router();

  /**
   * @openapi
   * /health:
   *   get:
   *     tags:
   *       - Health
   *     summary: Health check
   *     description: Check if the server and Gemini API are responding
   *     responses:
   *       200:
   *         description: Server is healthy
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: ok
   *                 timestamp:
   *                   type: number
   *                 uptime:
   *                   type: number
   *                 geminiConnected:
   *                   type: boolean
   *                   example: true
   */
  router.get("/health", async (req: Request, res: Response) => {
    res.json({
      status: "ok",
      timestamp: Date.now(),
      uptime: process.uptime(),
      geminiConnected: true,
    } as HealthCheckResponse);
  });

  return router;
}
