const express = require('express');
const router = express.Router();
const { prisma } = require('../utils/database');

// Get all bank accounts for the authenticated user
router.get('/', async (req, res) => {
  const userId = req.user.id;

  try {
    const bankAccounts = await prisma.bankAccount.findMany({
      where: { userId },
      include: { _count: { select: { expenses: true } } }
    });

    res.json({
      success: true,
      data: bankAccounts
    });
  } catch (error) {
    console.error('Error fetching bank accounts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bank accounts'
    });
  }
});

// Get a single bank account by ID
router.get('/:id', async (req, res) => {
  const userId = req.user.id;

  try {
    const bankAccount = await prisma.bankAccount.findFirst({
      where: { id: req.params.id, userId },
      include: { _count: { select: { expenses: true } } }
    });

    if (!bankAccount) {
      return res.status(404).json({
        success: false,
        message: 'Bank account not found'
      });
    }

    res.json({
      success: true,
      data: bankAccount
    });
  } catch (error) {
    console.error('Error fetching bank account:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bank account'
    });
  }
});

// Create a new bank account
router.post('/', async (req, res) => {
  const userId = req.user.id;
  const { name, accountNumber, bankName, accountType, balance, currency, isActive } = req.body;

  if (!name || !bankName) {
    return res.status(400).json({
      success: false,
      message: 'Account name and bank name are required'
    });
  }

  try {
    // Check if account already exists for this user
    const existingAccount = await prisma.bankAccount.findFirst({
      where: {
        name: { mode: 'insensitive', equals: name },
        userId
      }
    });

    if (existingAccount) {
      return res.status(400).json({
        success: false,
        message: 'Bank account with this name already exists'
      });
    }

    const newBankAccount = await prisma.bankAccount.create({
      data: {
        name,
        accountNumber: accountNumber || '',
        bankName,
        accountType: accountType || 'savings',
        balance: balance || 0,
        currency: currency || 'USD',
        isActive: isActive !== undefined ? isActive : true,
        userId
      }
    });

    res.status(201).json({
      success: true,
      message: 'Bank account created successfully',
      data: newBankAccount
    });
  } catch (error) {
    console.error('Error creating bank account:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create bank account'
    });
  }
});

// Update a bank account
router.put('/:id', async (req, res) => {
  const userId = req.user.id;
  const { name, accountNumber, bankName, accountType, balance, currency, isActive } = req.body;

  try {
    // Check if bank account exists
    const bankAccount = await prisma.bankAccount.findFirst({
      where: { id: req.params.id, userId }
    });

    if (!bankAccount) {
      return res.status(404).json({
        success: false,
        message: 'Bank account not found'
      });
    }

    // Check if new name conflicts with existing account
    if (name) {
      const existingAccount = await prisma.bankAccount.findFirst({
        where: {
          name: { mode: 'insensitive', equals: name },
          userId,
          id: { not: req.params.id }
        }
      });

      if (existingAccount) {
        return res.status(400).json({
          success: false,
          message: 'Bank account name already exists'
        });
      }
    }

    const updatedBankAccount = await prisma.bankAccount.update({
      where: { id: req.params.id },
      data: {
        name: name || bankAccount.name,
        accountNumber: accountNumber !== undefined ? accountNumber : bankAccount.accountNumber,
        bankName: bankName || bankAccount.bankName,
        accountType: accountType || bankAccount.accountType,
        balance: balance !== undefined ? balance : bankAccount.balance,
        currency: currency || bankAccount.currency,
        isActive: isActive !== undefined ? isActive : bankAccount.isActive
      }
    });

    res.json({
      success: true,
      message: 'Bank account updated successfully',
      data: updatedBankAccount
    });
  } catch (error) {
    console.error('Error updating bank account:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update bank account'
    });
  }
});

// Delete a bank account
router.delete('/:id', async (req, res) => {
  const userId = req.user.id;

  try {
    // Check if bank account exists
    const bankAccount = await prisma.bankAccount.findFirst({
      where: { id: req.params.id, userId },
      include: { _count: { select: { expenses: true } } }
    });

    if (!bankAccount) {
      return res.status(404).json({
        success: false,
        message: 'Bank account not found'
      });
    }

    // Check if bank account has expenses
    if (bankAccount._count.expenses > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete bank account with existing expenses. Delete expenses first or move them to another account.'
      });
    }

    await prisma.bankAccount.delete({
      where: { id: req.params.id }
    });

    res.json({
      success: true,
      message: 'Bank account deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting bank account:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete bank account'
    });
  }
});

module.exports = router;