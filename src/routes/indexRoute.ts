import { Router } from "express";
import userRoutes from "./user/userRoutes";
import transactionRoutes from "./transaction/transactionRoutes";
import budgetRoutes from "./budget/budgetRoutes";

const router = Router();

// Mount routes
router.use("/users", userRoutes);
router.use("/transactions", transactionRoutes);
router.use("/budgets", budgetRoutes);

export default router;
