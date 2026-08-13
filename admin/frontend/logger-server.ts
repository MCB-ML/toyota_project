import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import pino from "pino";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || (process.env.NODE_ENV === "development" ? 3001 : 80);
const isDev = process.env.NODE_ENV === "development";

console.log("Starting logger server...");
console.log("Environment:", isDev ? "development" : "production");
console.log("Port:", PORT);

// Create logs directory
const logDir =
  process.env.LOG_DIR || (isDev ? path.join(__dirname, "logs") : "/home/LogFiles/frontend");

if (isDev && !fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
  console.log("Created logs directory:", logDir);
}

// Configure Pino logger
const logger = pino({
  level: "info",
  transport: {
    targets: [
      {
        target: "pino-pretty",
        level: "info",
        options: {
          colorize: true,
          translateTime: "SYS:standard",
          ignore: "pid,hostname",
        },
      },
      {
        target: "pino/file",
        level: "info",
        options: {
          destination: path.join(logDir, "frontend-app.log"),
          mkdir: true,
        },
      },
    ],
  },
});

app.use(express.json({ limit: "1mb" }));

// CORS for local dev
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

app.post("/api/logs", (req, res) => {
  try {
    const { level, message, context, timestamp, userAgent, url } = req.body;

    const logData = {
      context,
      timestamp: timestamp || new Date().toISOString(),
      userAgent,
      url,
      ip: req.ip,
    };

    switch (level) {
      case "error":
        logger.error(logData, message || "Error");
        break;
      case "warn":
        logger.warn(logData, message || "Warning");
        break;
      case "debug":
        logger.debug(logData, message || "Debug");
        break;
      default:
        logger.info(logData, message || "Info");
    }

    res.json({ success: true });
  } catch (error) {
    logger.error({ error }, "Failed to process log");
    res.status(500).json({ success: false, error: "Logging failed" });
  }
});

// Health check
app.get("/api/health", (_req, res) => {
  res.send("healthy");
});

// Runtime Environment Variables
app.get("/env.js", (_req, res) => {
  const envVars = {
    VITE_BASE_OS_API_URL: process.env.VITE_BASE_OS_API_URL,
    VITE_TOKEN_EXPIRY_LIMIT: process.env.VITE_TOKEN_EXPIRY_LIMIT,
    VITE_INACTIVITY_TIMEOUT: process.env.VITE_INACTIVITY_TIMEOUT,
    VITE_DEMO_MODE: process.env.VITE_DEMO_MODE,
    VITE_DEMO_EMAIL: process.env.VITE_DEMO_EMAIL,
    VITE_DEMO_PASSWORD: process.env.VITE_DEMO_PASSWORD,
    VITE_DEMO_REFRESH_INTERVAL: process.env.VITE_DEMO_REFRESH_INTERVAL,
    VITE_LOG_API_URL: process.env.VITE_LOG_API_URL,
    VITE_BASE_AI_AGENT_API_URL: process.env.VITE_BASE_AI_AGENT_API_URL,
    // Add other VITE_ variables here if needed
  };
  res.setHeader("Content-Type", "application/javascript");
  res.send(`window.__ENV__ = ${JSON.stringify(envVars)};`);
});

// Serve static files in prod
if (!isDev) {
  const distPath = path.join(__dirname, "dist");

  if (fs.existsSync(distPath)) {
    console.log("Serving static files from:", distPath);
    app.use(express.static(distPath));

    // Handle client side routing
    app.get(/.*/, (req, res) => {
      if (req.path.startsWith("/api") || req.path.startsWith("/health")) {
        return res.status(404).send("Not found");
      }
      res.sendFile(path.join(distPath, "index.html"));
    });
  } else {
    console.warn("Warning: dist folder not found at", distPath);
  }
} else {
  console.log("Development mode - static files served by Vite");
}

app.listen(PORT, () => {
  logger.info(
    {
      port: PORT,
      environment: isDev ? "development" : "production",
    },
    "Logger server started",
  );
});

process.on("uncaughtException", (error) => {
  logger.error({ error }, "Uncaught exception");
  console.error("Uncaught exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  logger.error({ reason }, "Unhandled rejection");
  console.error("Unhandled rejection:", reason);
});
