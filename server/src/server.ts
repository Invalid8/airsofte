import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import dotenv from "dotenv";
import { GeminiService } from "./services/gemini.service";
import { createGeminiRouter } from "./routes/gemini";
import type { HealthCheckResponse, ApiResponse } from "./types";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || "development";

if (!process.env.GEMINI_API_KEY) {
  console.error("❌ GEMINI_API_KEY is not set in environment variables");
  process.exit(1);
}

const geminiService = new GeminiService(process.env.GEMINI_API_KEY);

const corsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",")
  : ["http://localhost:5173", "http://localhost:5174"];

app.use(helmet());
app.use(compression());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || corsOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

const requestCounts = new Map<string, { count: number; resetTime: number }>();

app.use((req: Request, res: Response, next: NextFunction) => {
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  const now = Date.now();
  const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000", 10);
  const maxRequests = parseInt(
    process.env.RATE_LIMIT_MAX_REQUESTS || "100",
    10,
  );

  if (!requestCounts.has(ip)) {
    requestCounts.set(ip, { count: 1, resetTime: now + windowMs });
  } else {
    const record = requestCounts.get(ip)!;

    if (now > record.resetTime) {
      record.count = 1;
      record.resetTime = now + windowMs;
    } else {
      record.count++;

      if (record.count > maxRequests) {
        res.status(429).json({
          success: false,
          error: "Too many requests, please try again later",
          timestamp: now,
        } as ApiResponse);
        return;
      }
    }
  }

  next();
});

app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    const sanitizedPath = req.path.replace(
      /\/session\/[a-f0-9-]+/i,
      "/session/:id",
    );
    console.log(
      `[${new Date().toISOString()}] ${req.method} ${sanitizedPath} - ${res.statusCode} (${duration}ms)`,
    );
  });

  next();
});

app.get("/health", async (req: Request, res: Response) => {
  res.json({
    status: "ok",
    timestamp: Date.now(),
    uptime: process.uptime(),
    geminiConnected: true,
  } as HealthCheckResponse);
});

app.use("/api", createGeminiRouter(geminiService));

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
    timestamp: Date.now(),
  } as ApiResponse);
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error("Server error:", err.message);

  res.status(500).json({
    success: false,
    error: NODE_ENV === "development" ? err.message : "Internal server error",
    timestamp: Date.now(),
  } as ApiResponse);
});

app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════╗
║   🚀 Airsofte Gemini API Server          ║
╠══════════════════════════════════════════╣
║   Environment: ${NODE_ENV.padEnd(23)}   ║
║   Port: ${String(PORT).padEnd(31)}  ║
║   CORS Origins: ${corsOrigins.length} allowed ${" ".repeat(14)} ║
╚══════════════════════════════════════════╝
  `);
  console.log("✅ Server is ready to accept requests");
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`📍 API endpoint: http://localhost:${PORT}/api/*`);
});
