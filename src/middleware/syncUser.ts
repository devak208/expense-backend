import { Request, Response, NextFunction } from "express";
import { clerkClient } from "@clerk/express";
import prisma from "../config/database";

/**
 * Middleware to sync Clerk user data with database
 * This runs after Clerk authentication middleware
 */
export const syncUserMiddleware = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    // Get user ID from Clerk auth (use as function)
    const auth = req.auth();
    const userId = auth?.userId;

    if (!userId) {
      return next();
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
