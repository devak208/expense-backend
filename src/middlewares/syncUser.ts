import { Request, Response, NextFunction } from "express";
import { clerkClient } from "@clerk/express";
import prisma from "../configs/database";

/**
 * Middleware to sync Clerk user data with database
 * This runs after Clerk authentication middleware
 */
export const syncUserMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get user ID from Clerk auth (use as function)
    // Clerk's clerkMiddleware() has already verified the Bearer token
    // and decoded it to extract userId, sessionId, etc.
    const auth = req.auth();
    const userId = auth?.userId;
    const sessionId = auth?.sessionId;

    // Debug: Show what Clerk extracted from the JWT token
    console.log("🔍 Clerk JWT Verification:");
    console.log("  - Bearer Token:", req.headers.authorization || "None");
    console.log("  - Decoded userId:", userId || "None");
    console.log("  - sessionId:", sessionId || "None");

    if (!userId || !sessionId) {
      console.log("⚠️  No userId or sessionId found");
      res.status(401).json({
        success: false,
        message: "Unauthorized - Please sign in to access this resource",
        error: "AUTHENTICATION_REQUIRED",
      });
      return;
    }

    // Check if user exists in database
    let user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    // If user doesn't exist, fetch from Clerk and create in database
    if (!user) {
      const clerkUser = await clerkClient.users.getUser(userId);

      user = await prisma.user.create({
        data: {
          clerkId: clerkUser.id,
          email: clerkUser.emailAddresses[0]?.emailAddress || "",
          firstName: clerkUser.firstName,
          lastName: clerkUser.lastName,
          imageUrl: clerkUser.imageUrl,
        },
      });

      console.log("✅ New user synced to database:", user.email);
    }

    // Attach user to request object for use in routes
    req.user = user;

    next();
  } catch (error) {
    console.error("Error syncing user:", error);
    next(error);
  }
};
