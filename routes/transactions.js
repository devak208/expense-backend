const express = require("express");
const router = express.Router();
const { prisma } = require("../utils/database");

// Get all transactions for the authenticated user
router.get("/", async (req, res) => {
  const userId = req.user.id;
  const { type, startDate, endDate, category } = req.query;

  const where = { userId };

  // Filter by type (income or expense)
  if (type && (type === "income" || type === "expense")) {
    where.type = type;
  }

  // Filter by category
  if (category) {
    where.category = category;
  }

  // Filter by date range
  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = new Date(startDate);
    if (endDate) where.date.lte = new Date(endDate);
  }

  try {
    const transactions = await prisma.transaction.findMany({
      where,
      orderBy: { date: "desc" },
    });

    res.json({
      success: true,
      data: transactions,
      count: transactions.length,
    });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch transactions",
    });
  }
});

// Get a single transaction by ID
router.get("/:id", async (req, res) => {
  const userId = req.user.id;

  try {
    const transaction = await prisma.transaction.findFirst({
      where: {
        id: req.params.id,
        userId,
      },
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    res.json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    console.error("Error fetching transaction:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch transaction",
    });
  }
});

// Get transaction statistics
router.get("/stats/summary", async (req, res) => {
  const userId = req.user.id;
  const { startDate, endDate } = req.query;

  const where = { userId };

  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = new Date(startDate);
    if (endDate) where.date.lte = new Date(endDate);
  }

  try {
    const transactions = await prisma.transaction.findMany({
      where,
    });

    const totalIncome = transactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = transactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);

    const balance = totalIncome - totalExpense;

    // Category-wise breakdown
    const categoryBreakdown = {};
    transactions.forEach((transaction) => {
      if (!categoryBreakdown[transaction.category]) {
        categoryBreakdown[transaction.category] = {
          income: 0,
          expense: 0,
          count: 0,
        };
      }
      if (transaction.type === "income") {
        categoryBreakdown[transaction.category].income += transaction.amount;
      } else {
        categoryBreakdown[transaction.category].expense += transaction.amount;
      }
      categoryBreakdown[transaction.category].count += 1;
    });

    res.json({
      success: true,
      data: {
        totalIncome,
        totalExpense,
        balance,
        transactionCount: transactions.length,
        categoryBreakdown,
      },
    });
  } catch (error) {
    console.error("Error fetching transaction stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch transaction statistics",
    });
  }
});

// Create a new transaction
router.post("/", async (req, res) => {
  const userId = req.user.id;
  const { type, amount, category, description, date } = req.body;

  // Validation
  if (!type || (type !== "income" && type !== "expense")) {
    return res.status(400).json({
      success: false,
      message: 'Type must be either "income" or "expense"',
    });
  }

  if (!amount || amount <= 0) {
    return res.status(400).json({
      success: false,
      message: "Amount must be a positive number",
    });
  }

  if (!category || category.trim() === "") {
    return res.status(400).json({
      success: false,
      message: "Category is required",
    });
  }

  try {
    const transaction = await prisma.transaction.create({
      data: {
        type,
        amount: parseFloat(amount),
        category: category.trim(),
        description: description?.trim() || null,
        date: date ? new Date(date) : new Date(),
        userId,
      },
    });

    res.status(201).json({
      success: true,
      message: "Transaction created successfully",
      data: transaction,
    });
  } catch (error) {
    console.error("Error creating transaction:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create transaction",
    });
  }
});

// Update a transaction
router.put("/:id", async (req, res) => {
  const userId = req.user.id;
  const { type, amount, category, description, date } = req.body;

  // Validation
  if (type && type !== "income" && type !== "expense") {
    return res.status(400).json({
      success: false,
      message: 'Type must be either "income" or "expense"',
    });
  }

  if (amount && amount <= 0) {
    return res.status(400).json({
      success: false,
      message: "Amount must be a positive number",
    });
  }

  try {
    // Check if transaction exists and belongs to user
    const existingTransaction = await prisma.transaction.findFirst({
      where: {
        id: req.params.id,
        userId,
      },
    });

    if (!existingTransaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    // Prepare update data
    const updateData = {};
    if (type) updateData.type = type;
    if (amount) updateData.amount = parseFloat(amount);
    if (category) updateData.category = category.trim();
    if (description !== undefined)
      updateData.description = description?.trim() || null;
    if (date) updateData.date = new Date(date);

    const transaction = await prisma.transaction.update({
      where: { id: req.params.id },
      data: updateData,
    });

    res.json({
      success: true,
      message: "Transaction updated successfully",
      data: transaction,
    });
  } catch (error) {
    console.error("Error updating transaction:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update transaction",
    });
  }
});

// Delete a transaction
router.delete("/:id", async (req, res) => {
  const userId = req.user.id;

  try {
    // Check if transaction exists and belongs to user
    const existingTransaction = await prisma.transaction.findFirst({
      where: {
        id: req.params.id,
        userId,
      },
    });

    if (!existingTransaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    await prisma.transaction.delete({
      where: { id: req.params.id },
    });

    res.json({
      success: true,
      message: "Transaction deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting transaction:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete transaction",
    });
  }
});

module.exports = router;
