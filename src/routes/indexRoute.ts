import { Router } from "express";
import userRoutes from "./user/userRoutes";
import transactionRoutes from "./transaction/transactionRoutes";

const router = Router();

// Mount routes
router.use("/users", userRoutes);
router.use("/transactions", transactionRoutes);

export default router;
