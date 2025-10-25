import { Router } from "express";
import userRoutes from "./userRoutes";

const router = Router();

// Mount routes
router.use("/users", userRoutes);

// Health check
router.get("/health", (_req, res) => {
  res.json({
    success: true,
    message: "API is running",
    timestamp: new Date().toISOString(),
  });
});

export default router;
