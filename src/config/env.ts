import { config } from "dotenv";

config();

export const env = {
  port: process.env.PORT || 6000,
  nodeEnv: process.env.NODE_ENV || "development",
  databaseUrl: process.env.DATABASE_URL,
  clerkPublishableKey: process.env.CLERK_PUBLISHABLE_KEY,
  clerkSecretKey: process.env.CLERK_SECRET_KEY,
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:8081",
};

// Validate required environment variables
const requiredEnvVars = [
  "DATABASE_URL",
  "CLERK_PUBLISHABLE_KEY",
  "CLERK_SECRET_KEY",
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}
