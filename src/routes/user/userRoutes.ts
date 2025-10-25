import { Router, Request, Response } from "express";
import { requireAuth } from "@clerk/express";
import prisma from "../../config/database";

const router = Router();

/**
 * GET /api/users/me
 * Get current user profile
 */
router.get("/me", requireAuth(), async (req: Request, res: Response) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.json({
      success: true,
      data: {
        id: user.id,
        clerkId: user.clerkId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        imageUrl: user.imageUrl,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch user",
    });
  }
});

/**
 * PUT /api/users/me
 * Update current user profile
 */
router.put("/me", requireAuth(), async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { firstName, lastName } = req.body;

    if (!userId) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        firstName,
        lastName,
      },
    });

    return res.json({
      success: true,
      data: updatedUser,
      message: "Profile updated successfully",
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update profile",
    });
  }
});

/**
 * GET /api/users/stats
 * Get user statistics
 */
router.get("/stats", requireAuth(), async (req: Request, res: Response) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Add your stats logic here
    // For now, returning basic info
    const stats = {
      accountAge: Math.floor(
        (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      ),
      lastLogin: new Date().toISOString(),
    };

    return res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch statistics",
    });
  }
});

export default router;
