const express = require('express');
const router = express.Router();
const { prisma } = require('../utils/database');

// Get all categories for the authenticated user
router.get('/', async (req, res) => {
  const userId = req.user.id;

  try {
    const categories = await prisma.category.findMany({
      where: { userId },
      include: { _count: { select: { expenses: true, subcategories: true } } }
    });

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories'
    });
  }
});

// Get a single category by ID
router.get('/:id', async (req, res) => {
  const userId = req.user.id;

  try {
    const category = await prisma.category.findFirst({
      where: { id: req.params.id, userId },
      include: { _count: { select: { expenses: true, subcategories: true } } }
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch category'
    });
  }
});

// Create a new category
router.post('/', async (req, res) => {
  const userId = req.user.id;
  const { name, description, icon } = req.body;

  if (!name) {
    return res.status(400).json({
      success: false,
      message: 'Category name is required'
    });
  }

  try {
    // Check if category already exists for this user
    const existingCategory = await prisma.category.findFirst({
      where: {
        name: { mode: 'insensitive', equals: name },
        userId
      }
    });

    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: 'Category already exists'
      });
    }

    const newCategory = await prisma.category.create({
      data: {
        name,
        description: description || '',
        icon: icon || '📁',
        userId
      }
    });

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: newCategory
    });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create category'
    });
  }
});

// Update a category
router.put('/:id', async (req, res) => {
  const userId = req.user.id;
  const { name, description, icon } = req.body;

  try {
    // Check if category exists
    const category = await prisma.category.findFirst({
      where: { id: req.params.id, userId }
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Check if new name conflicts with existing category
    if (name) {
      const existingCategory = await prisma.category.findFirst({
        where: {
          name: { mode: 'insensitive', equals: name },
          userId,
          id: { not: req.params.id }
        }
      });

      if (existingCategory) {
        return res.status(400).json({
          success: false,
          message: 'Category name already exists'
        });
      }
    }

    const updatedCategory = await prisma.category.update({
      where: { id: req.params.id },
      data: {
        name: name || category.name,
        description: description !== undefined ? description : category.description,
        icon: icon || category.icon
      }
    });

    res.json({
      success: true,
      message: 'Category updated successfully',
      data: updatedCategory
    });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update category'
    });
  }
});

// Delete a category
router.delete('/:id', async (req, res) => {
  const userId = req.user.id;

  try {
    // Check if category exists
    const category = await prisma.category.findFirst({
      where: { id: req.params.id, userId },
      include: { _count: { select: { subcategories: true, expenses: true } } }
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Check if category has subcategories
    if (category._count.subcategories > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete category with existing subcategories. Delete subcategories first.'
      });
    }

    // Check if category has expenses
    if (category._count.expenses > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete category with existing expenses. Delete expenses first.'
      });
    }

    await prisma.category.delete({
      where: { id: req.params.id }
    });

    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete category'
    });
  }
});

module.exports = router;