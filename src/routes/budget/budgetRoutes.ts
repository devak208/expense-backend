import { Router } from "express";
import { requireAuth } from "@clerk/express";
import {
    getAllBudgets,
    createBudget,
    updateBudget,
    deleteBudget,
} from "../../controllers/budget/budgetController";

const router = Router();

router.get("/", requireAuth(), getAllBudgets);
router.post("/", requireAuth(), createBudget);
router.put("/:id", requireAuth(), updateBudget);
router.delete("/:id", requireAuth(), deleteBudget);

export default router;
