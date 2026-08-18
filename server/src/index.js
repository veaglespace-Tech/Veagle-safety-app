import express from 'express';
import http from 'http';
import cors from 'cors';
import path from 'path';
import { config } from './config/index.js';
import { prisma } from './config/prisma.js';
import apiRouter from './routes/api.js';
import { initSocketIO } from './socket.js';

const app = express();
const server = http.createServer(app);

const PORT = config.port;

// Trust Nginx / Cloudflare proxy
app.set("trust proxy", 1);

// Middleware (Body Parsers BEFORE API Routes)
app.use(cors());
app.use(
  express.json({
    limit: process.env.JSON_BODY_LIMIT || "10mb",
  })
);
app.use(
  express.urlencoded({
    limit: process.env.JSON_BODY_LIMIT || "10mb",
    extended: true,
  })
);

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(process.cwd(), 'public', 'uploads')));

// API Routes
app.use("/api", apiRouter);

// Health Check Endpoint
app.get("/healthz", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "veagle-safety-server",
    timestamp: new Date().toISOString(),
    uptimeSeconds: Number(process.uptime().toFixed(0)),
  });
});

// Readiness Endpoint (DB Connection Check)
app.get("/readyz", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      status: "ready",
      database: "connected",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      status: "not_ready",
      database: "disconnected",
      message: "Database connection check failed",
    });
  }
});


// Catch-all 404 handler for non-existent routes
app.use("*", (req, res) => {
  res.status(404).json({ success: false, message: "resource not found" });
});

// Global Error Handler Middleware
app.use((err, req, res, next) => {
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors || {},
    });
  }

  const statusCode = err.statusCode || (res.statusCode === 200 ? 500 : res.statusCode);
  const isSchemaMismatchError =
    err?.code === "P2022" ||
    String(err?.message || "").toLowerCase().includes("does not exist in the current database");
  const clientMessage = isSchemaMismatchError
    ? "Server settings are updating. Please retry in a moment."
    : err.message || "Server Error";

  res.status(statusCode).json({
    success: false,
    message: clientMessage,
    errors: process.env.NODE_ENV === "production" ? null : { stack: err.stack },
  });
});

// Server Listen Helper
const listen = (port) =>
  new Promise((resolve, reject) => {
    const instance = server.listen(port);
    instance.once("listening", () => resolve(instance));
    instance.once("error", reject);
  });

import { startSosPeriodicWorker } from './services/sosPeriodicWorker.js';

// Start Server Routine
const startServer = async () => {
  console.log("prisma connecting...");
  await prisma.$connect();
  console.log("prisma connected");

  initSocketIO(server);
  startSosPeriodicWorker();

  await listen(PORT);
  console.log(`server running on port ${PORT}`);
};

// Shutdown Server Routine
const shutdownServer = async () => {
  await prisma.$disconnect().catch(() => {});
};

// Main Execution block
if (process.env.NODE_ENV !== "test") {
  startServer().catch(async (error) => {
    if (error?.code === "EADDRINUSE") {
      console.error(
        `Failed to start server: port ${PORT} is already in use. Stop the existing process or set PORT to a free port.`
      );
    } else {
      console.error("Failed to start server:", error.message);
    }

    await shutdownServer();
    process.exit(1);
  });
}

export { app, server, startServer, shutdownServer };
