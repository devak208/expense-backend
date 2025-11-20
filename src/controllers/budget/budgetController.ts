import { Request, Response } from "express";
import prisma from "../../configs/database";

export const getAllBudgets = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }

        const budgets = await prisma.budget.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
        });

        res.status(200).json({
            success: true,
            data: budgets,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching budgets",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};

export const createBudget = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }

        const { category, amount, period } = req.body;

        const budget = await prisma.budget.create({
            data: {
                userId,
                category,
                amount,
                period,
            },
        });

        res.status(201).json({
            success: true,
            data: budget,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error creating budget",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};

export const updateBudget = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }

        const { category, amount, period } = req.body;

        const budget = await prisma.budget.findUnique({
            where: { id },
        });

        if (!budget) {
            res.status(404).json({ success: false, message: "Budget not found" });
            return;
        }

        if (budget.userId !== userId) {
            res.status(403).json({ success: false, message: "Unauthorized" });
            return;
        }

        const updatedBudget = await prisma.budget.update({
            where: { id },
            data: {
                category,
                amount,
                period,
            },
        });

        res.status(200).json({
            success: true,
            data: updatedBudget,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error updating budget",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};

export const deleteBudget = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }

        const budget = await prisma.budget.findUnique({
            where: { id },
        });

        if (!budget) {
            res.status(404).json({ success: false, message: "Budget not found" });
            return;
        }

        if (budget.userId !== userId) {
            res.status(403).json({ success: false, message: "Unauthorized" });
            return;
        }

        await prisma.budget.delete({
            where: { id },
        });

        res.status(200).json({
            success: true,
            message: "Budget deleted successfully",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error deleting budget",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};
