import { Router } from "express";
import userRoutes from "./user/userRoutes";

const router = Router();

// Health check
router.get("/health", (_req, res) => {
  res.json({
    success: true,
    message: "API is running",
    timestamp: new Date().toISOString(),
  });
});

// Mount routes
router.use("/users", userRoutes);

export default router;
