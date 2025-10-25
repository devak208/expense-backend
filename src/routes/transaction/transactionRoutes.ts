import { Router } from "express";
import { requireAuth } from "@clerk/express";
import {
  getAllTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getTransactionStats,
} from "../../controllers/transaction/transactionController";

const router = Router();

/**
 * GET /api/transactions
 * Get all transactions for the current user
 */
router.get("/", requireAuth(), getAllTransactions);

/**
 * GET /api/transactions/stats/summary
 * Get transaction statistics
 * Note: This must come before /:id route to avoid conflicts
 */
router.get("/stats/summary", requireAuth(), getTransactionStats);

/**
 * GET /api/transactions/:id
 * Get a specific transaction by ID
 */
router.get("/:id", requireAuth(), getTransactionById);

/**
 * POST /api/transactions
 * Create a new transaction
 */
router.post("/", requireAuth(), createTransaction);

/**
 * PUT /api/transactions/:id
 * Update a transaction
 */
router.put("/:id", requireAuth(), updateTransaction);

/**
 * DELETE /api/transactions/:id
 * Delete a transaction
 */
router.delete("/:id", requireAuth(), deleteTransaction);

export default router;
