import express, { Application, Request, Response, NextFunction } from "express";
import cors from "cors";
import { clerkMiddleware, requireAuth } from "@clerk/express";
import { env } from "./config/env";
import { syncUserMiddleware } from "./middleware/syncUser";
import { errorHandler } from "./middleware/errorHandler";
import routes from "./routes";
import prisma from "./config/database";

// Initialize Express app
const app: Application = express();

// Middleware
app.use(
  cors({
    origin: env.frontendUrl === "*" ? "*" : env.frontendUrl,
    credentials: env.frontendUrl !== "*",
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Clerk authentication middleware
// By default, it handles Bearer tokens from Authorization header for API requests
app.use(clerkMiddleware());

// Root route (public)
app.get("/", (_req, res) => {
  res.json({
    success: true,
    message: "Expense Tracker API",
    version: "1.0.0",
  });
});

// Protected routes - apply auth and sync middleware
app.use(
  "/api",
  (req: Request, res: Response, next: NextFunction) => {
    // Check if user is authenticated (use req.auth() as function)
    const auth = req.auth();
    const authHeader = req.headers.authorization;

    console.log("🔍 Auth check:");
    console.log("  - Auth header:", authHeader ? "Present" : "Missing");
    if (authHeader) {
      console.log("  - Header value:", authHeader.substring(0, 50) + "...");
    }
    console.log("  - User ID:", auth?.userId || "None");
    console.log("  - Session ID:", auth?.sessionId || "None");

    if (!auth?.userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - Please sign in to access this resource",
        error: "AUTHENTICATION_REQUIRED",
      });
    }

    // User is authenticated, proceed with sync
    return syncUserMiddleware(req, res, next);
  },
  routes
);

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
const PORT = Number(env.port);
const HOST = "0.0.0.0"; // Listen on all network interfaces
const server = app.listen(PORT, HOST, () => {
  console.log("🚀 Server is running");
  console.log(`📍 Port: ${PORT}`);
  console.log(`🌍 Environment: ${env.nodeEnv}`);
  console.log(`🔗 Local: http://localhost:${PORT}`);
  console.log(`🔗 Network: http://10.190.203.22:${PORT}`);
  console.log(`🔐 Clerk Auth: Enabled`);
});

// Graceful shutdown
const shutdown = async () => {
  console.log("⚠️  Shutdown signal received: closing HTTP server");
  server.close(async () => {
    console.log("🔌 HTTP server closed");
    await prisma.$disconnect();
    console.log("🗄️  Database connection closed");
    process.exit(0);
  });
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

export default server;
