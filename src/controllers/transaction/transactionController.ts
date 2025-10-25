import { Request, Response } from "express";
import prisma from "../../configs/database";

// Validation helper
const validateTransaction = (
  type: string,
  amount: number,
  category: string,
  description: string
): string | null => {
  if (!type || !["income", "expense"].includes(type)) {
    return "Type must be either 'income' or 'expense'";
  }
  if (!amount || isNaN(amount) || amount <= 0) {
    return "Amount must be a positive number";
  }
  if (!category || category.trim().length === 0) {
    return "Category is required";
  }
  if (!description || description.trim().length === 0) {
    return "Description is required";
  }
  return null;
};

/**
 * Get all transactions for the current user
 */
export const getAllTransactions = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const {
      type = "all",
      limit = "100",
      offset = "0",
      startDate,
      endDate,
      category,
    } = req.query;

    // Build filter conditions
    const where: any = { userId };

    if (type !== "all") {
      where.type = type;
    }

    if (category) {
      where.category = category;
    }

    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.date.lte = new Date(endDate as string);
      }
    }

    const transactions = await prisma.transaction.findMany({
      where,
      orderBy: { date: "desc" },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
    });

    const total = await prisma.transaction.count({ where });

    return res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          total,
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch transactions",
    });
  }
};

/**
 * Get a specific transaction by ID
 */
export const getTransactionById = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const transaction = await prisma.transaction.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    return res.json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    console.error("Error fetching transaction:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch transaction",
    });
  }
};

/**
 * Create a new transaction
 */
export const createTransaction = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const { type, amount, category, description, date } = req.body;

    // Validate input
    const validationError = validateTransaction(
      type,
      amount,
      category,
      description
    );
    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const transaction = await prisma.transaction.create({
      data: {
        userId,
        type,
        amount: parseFloat(amount),
        category: category.trim(),
        description: description.trim(),
        date: date ? new Date(date) : new Date(),
      },
    });

    return res.status(201).json({
      success: true,
      message: "Transaction created successfully",
      data: transaction,
    });
  } catch (error) {
    console.error("Error creating transaction:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create transaction",
    });
  }
};

/**
 * Update a transaction
 */
export const updateTransaction = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const { type, amount, category, description, date } = req.body;

    // Check if transaction exists and belongs to user
    const existingTransaction = await prisma.transaction.findFirst({
      where: { id, userId },
    });

    if (!existingTransaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    // Build update data
    const updateData: any = {};

    if (type !== undefined) {
      if (!["income", "expense"].includes(type)) {
        return res.status(400).json({
          success: false,
          message: "Type must be either 'income' or 'expense'",
        });
      }
      updateData.type = type;
    }

    if (amount !== undefined) {
      if (isNaN(amount) || amount <= 0) {
        return res.status(400).json({
          success: false,
          message: "Amount must be a positive number",
        });
      }
      updateData.amount = parseFloat(amount);
    }

    if (category !== undefined) {
      if (category.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: "Category cannot be empty",
        });
      }
      updateData.category = category.trim();
    }

    if (description !== undefined) {
      if (description.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: "Description cannot be empty",
        });
      }
      updateData.description = description.trim();
    }

    if (date !== undefined) {
      updateData.date = new Date(date);
    }

    const transaction = await prisma.transaction.update({
      where: { id },
      data: updateData,
    });

    return res.json({
      success: true,
      message: "Transaction updated successfully",
      data: transaction,
    });
  } catch (error) {
    console.error("Error updating transaction:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update transaction",
    });
  }
};

/**
 * Delete a transaction
 */
export const deleteTransaction = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // Check if transaction exists and belongs to user
    const existingTransaction = await prisma.transaction.findFirst({
      where: { id, userId },
    });

    if (!existingTransaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    await prisma.transaction.delete({
      where: { id },
    });

    return res.json({
      success: true,
      message: "Transaction deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting transaction:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete transaction",
    });
  }
};

/**
 * Get transaction statistics
 */
export const getTransactionStats = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const { startDate, endDate } = req.query;

    // Build filter conditions
    const where: any = { userId };

    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.date.lte = new Date(endDate as string);
      }
    }

    // Get income total
    const incomeTotal = await prisma.transaction.aggregate({
      where: { ...where, type: "income" },
      _sum: { amount: true },
    });

    // Get expense total
    const expenseTotal = await prisma.transaction.aggregate({
      where: { ...where, type: "expense" },
      _sum: { amount: true },
    });

    // Get category breakdown for expenses
    const expensesByCategory = await prisma.transaction.groupBy({
      by: ["category"],
      where: { ...where, type: "expense" },
      _sum: { amount: true },
    });

    // Get category breakdown for income
    const incomeByCategory = await prisma.transaction.groupBy({
      by: ["category"],
      where: { ...where, type: "income" },
      _sum: { amount: true },
    });

    const totalIncome = incomeTotal._sum.amount || 0;
    const totalExpense = expenseTotal._sum.amount || 0;
    const balance = totalIncome - totalExpense;

    return res.json({
      success: true,
      data: {
        totalIncome,
        totalExpense,
        balance,
        expensesByCategory: expensesByCategory.map((item) => ({
          category: item.category,
          amount: item._sum.amount || 0,
        })),
        incomeByCategory: incomeByCategory.map((item) => ({
          category: item.category,
          amount: item._sum.amount || 0,
        })),
      },
    });
  } catch (error) {
    console.error("Error fetching transaction stats:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch transaction statistics",
    });
  }
};
