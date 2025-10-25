import { Router } from "express";
import { requireAuth } from "@clerk/express";
import {
  getCurrentUser,
  updateCurrentUser,
  getUserStats,
} from "../../controllers/user/userController";

const router = Router();

/**
 * GET /api/users/me
 * Get current user profile
 */
router.get("/me", requireAuth(), getCurrentUser);

/**
 * PUT /api/users/me
 * Update current user profile
 */
router.put("/me", requireAuth(), updateCurrentUser);

/**
 * GET /api/users/stats
 * Get user statistics
 */
router.get("/stats", requireAuth(), getUserStats);

export default router;
