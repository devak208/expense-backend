const express = require('express');
const router = express.Router();
const { prisma } = require('../utils/database');

// Get all expenses for the authenticated user
router.get('/', async (req, res) => {
  const userId = req.user.id;
  const { categoryId, subcategoryId, bankAccountId, startDate, endDate } = req.query;

  const where = { userId };

  if (categoryId) where.categoryId = categoryId;
  if (subcategoryId) where.subcategoryId = subcategoryId;
  if (bankAccountId) where.bankAccountId = bankAccountId;
  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = new Date(startDate);
    if (endDate) where.date.lte = new Date(endDate);
  }

  try {
    const expenses = await prisma.expense.findMany({
      where,
      include: {
        category: true,
        subcategory: true,
        bankAccount: true
      },
      orderBy: { date: 'desc' }
    });

    res.json({
      success: true,
      data: expenses,
      count: expenses.length
    });
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch expenses'
    });
  }
});

// Get a single expense by ID
router.get('/:id', async (req, res) => {
  const userId = req.user.id;

  try {
    const expense = await prisma.expense.findFirst({
      where: {
        id: req.params.id,
        userId
      },
      include: {
        category: true,
        subcategory: true,
        bankAccount: true
      }
    });

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    res.json({
      success: true,
      data: expense
    });
  } catch (error) {
    console.error('Error fetching expense:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch expense'
    });
  }
});

// Get expense statistics
router.get('/stats/summary', async (req, res) => {
  const userId = req.user.id;
  const { startDate, endDate, categoryId } = req.query;

  const where = { userId };

  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = new Date(startDate);
    if (endDate) where.date.lte = new Date(endDate);
  }
  if (categoryId) where.categoryId = categoryId;

  try {
    const expenses = await prisma.expense.findMany({
      where,
      include: { category: true }
    });

    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const expenseCount = expenses.length;
    const averageExpense = expenseCount > 0 ? totalExpenses / expenseCount : 0;

    // Category-wise breakdown
    const categoryBreakdown = {};
    expenses.forEach(exp => {
      const catName = exp.category.name;
      if (!categoryBreakdown[catName]) {
        categoryBreakdown[catName] = { total: 0, count: 0 };
      }
      categoryBreakdown[catName].total += exp.amount;
      categoryBreakdown[catName].count += 1;
    });

    res.json({
      success: true,
      data: {
        totalExpenses,
        expenseCount,
        averageExpense: Math.round(averageExpense * 100) / 100,
        categoryBreakdown
      }
    });
  } catch (error) {
    console.error('Error fetching expense stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch expense statistics'
    });
  }
});

// Create a new expense
router.post('/', async (req, res) => {
  const userId = req.user.id;
  const { 
    amount, 
    categoryId, 
    subcategoryId, 
    bankAccountId, 
    description, 
    date, 
    paymentMethod,
    tags 
  } = req.body;

  // Validation
  if (!amount || !categoryId || !bankAccountId) {
    return res.status(400).json({
      success: false,
      message: 'Amount, category, and bank account are required'
    });
  }

  if (amount <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Amount must be greater than 0'
    });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Verify category
      const category = await tx.category.findFirst({
        where: { id: categoryId, userId }
      });
      if (!category) {
        throw new Error('Category not found');
      }

      // Verify subcategory if provided
      if (subcategoryId) {
        const subcategory = await tx.subcategory.findFirst({
          where: { id: subcategoryId, categoryId, userId }
        });
        if (!subcategory) {
          throw new Error('Subcategory not found or does not belong to the specified category');
        }
      }

      // Verify bank account
      const bankAccount = await tx.bankAccount.findFirst({
        where: { id: bankAccountId, userId }
      });
      if (!bankAccount) {
        throw new Error('Bank account not found');
      }

      // Create expense
      const newExpense = await tx.expense.create({
        data: {
          amount: parseFloat(amount),
          categoryId,
          subcategoryId: subcategoryId || null,
          bankAccountId,
          description: description || '',
          date: date ? new Date(date) : new Date(),
          paymentMethod: paymentMethod || 'cash',
          tags: tags || [],
          userId
        },
        include: {
          category: true,
          subcategory: true,
          bankAccount: true
        }
      });

      // Update bank account balance
      await tx.bankAccount.update({
        where: { id: bankAccountId },
        data: { balance: { decrement: parseFloat(amount) } }
      });

      return newExpense;
    });

    res.status(201).json({
      success: true,
      message: 'Expense created successfully',
      data: result
    });
  } catch (error) {
    console.error('Error creating expense:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create expense'
    });
  }
});

// Update an expense
router.put('/:id', async (req, res) => {
  const userId = req.user.id;
  const {
    amount,
    categoryId,
    subcategoryId,
    bankAccountId,
    description,
    date,
    paymentMethod,
    tags
  } = req.body;

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Get current expense
      const currentExpense = await tx.expense.findFirst({
        where: { id: req.params.id, userId }
      });
      if (!currentExpense) {
        throw new Error('Expense not found');
      }

      const oldAmount = currentExpense.amount;
      const oldBankAccountId = currentExpense.bankAccountId;

      // Verify new category if provided
      if (categoryId) {
        const category = await tx.category.findFirst({
          where: { id: categoryId, userId }
        });
        if (!category) {
          throw new Error('Category not found');
        }
      }

      // Verify new subcategory if provided
      if (subcategoryId) {
        const targetCategoryId = categoryId || currentExpense.categoryId;
        const subcategory = await tx.subcategory.findFirst({
          where: { id: subcategoryId, categoryId: targetCategoryId, userId }
        });
        if (!subcategory) {
          throw new Error('Subcategory not found or does not belong to the specified category');
        }
      }

      // Verify new bank account if provided
      if (bankAccountId) {
        const bankAccount = await tx.bankAccount.findFirst({
          where: { id: bankAccountId, userId }
        });
        if (!bankAccount) {
          throw new Error('Bank account not found');
        }
      }

      const newAmount = amount !== undefined ? parseFloat(amount) : oldAmount;
      const newBankAccountId = bankAccountId || oldBankAccountId;

      // Update balances
      if (oldBankAccountId === newBankAccountId) {
        // Same account - adjust by difference
        const difference = newAmount - oldAmount;
        await tx.bankAccount.update({
          where: { id: newBankAccountId },
          data: { balance: { decrement: difference } }
        });
      } else {
        // Different account - revert old, deduct from new
        await tx.bankAccount.update({
          where: { id: oldBankAccountId },
          data: { balance: { increment: oldAmount } }
        });
        await tx.bankAccount.update({
          where: { id: newBankAccountId },
          data: { balance: { decrement: newAmount } }
        });
      }

      // Update expense
      const updatedExpense = await tx.expense.update({
        where: { id: req.params.id },
        data: {
          amount: newAmount,
          categoryId: categoryId || currentExpense.categoryId,
          subcategoryId: subcategoryId !== undefined ? subcategoryId : currentExpense.subcategoryId,
          bankAccountId: newBankAccountId,
          description: description !== undefined ? description : currentExpense.description,
          date: date ? new Date(date) : currentExpense.date,
          paymentMethod: paymentMethod || currentExpense.paymentMethod,
          tags: tags || currentExpense.tags
        },
        include: {
          category: true,
          subcategory: true,
          bankAccount: true
        }
      });

      return updatedExpense;
    });

    res.json({
      success: true,
      message: 'Expense updated successfully',
      data: result
    });
  } catch (error) {
    console.error('Error updating expense:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update expense'
    });
  }
});

// Delete an expense
router.delete('/:id', async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Get expense
      const expense = await tx.expense.findFirst({
        where: { id: req.params.id, userId }
      });
      if (!expense) {
        throw new Error('Expense not found');
      }

      // Delete expense
      await tx.expense.delete({
        where: { id: req.params.id }
      });

      // Revert bank account balance
      await tx.bankAccount.update({
        where: { id: expense.bankAccountId },
        data: { balance: { increment: expense.amount } }
      });

      return expense;
    });

    res.json({
      success: true,
      message: 'Expense deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting expense:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to delete expense'
    });
  }
});

module.exports = router;