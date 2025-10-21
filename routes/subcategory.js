const express = require('express');
const router = express.Router();
const { prisma } = require('../utils/database');

// Get all subcategories for the authenticated user
router.get('/', async (req, res) => {
  const userId = req.user.id;
  const { categoryId } = req.query;

  const where = { userId };
  if (categoryId) where.categoryId = categoryId;

  try {
    const subcategories = await prisma.subcategory.findMany({
      where,
      include: { category: true, _count: { select: { expenses: true } } }
    });

    res.json({
      success: true,
      data: subcategories
    });
  } catch (error) {
    console.error('Error fetching subcategories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subcategories'
    });
  }
});

// Get a single subcategory by ID
router.get('/:id', async (req, res) => {
  const userId = req.user.id;

  try {
    const subcategory = await prisma.subcategory.findFirst({
      where: { id: req.params.id, userId },
      include: { category: true, _count: { select: { expenses: true } } }
    });

    if (!subcategory) {
      return res.status(404).json({
        success: false,
        message: 'Subcategory not found'
      });
    }

    res.json({
      success: true,
      data: subcategory
    });
  } catch (error) {
    console.error('Error fetching subcategory:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subcategory'
    });
  }
});

// Create a new subcategory
router.post('/', (req, res) => {
  const userId = req.auth.userId;
  const { categoryId, name, description } = req.body;

  if (!categoryId || !name) {
    return res.status(400).json({
      success: false,
      message: 'Category ID and subcategory name are required'
    });
  }

  // Verify category exists and belongs to user
  const category = database.categories.find(
    cat => cat.id === categoryId && cat.userId === userId
  );

  if (!category) {
    return res.status(404).json({
      success: false,
      message: 'Category not found'
    });
  }

  // Check if subcategory already exists for this category
  const existingSubcategory = database.subcategories.find(
    sub => sub.name.toLowerCase() === name.toLowerCase() && 
           sub.categoryId === categoryId && 
           sub.userId === userId
  );

  if (existingSubcategory) {
    return res.status(400).json({
      success: false,
      message: 'Subcategory already exists in this category'
    });
  }

  const newSubcategory = {
    id: generateId(),
    userId,
    categoryId,
    categoryName: category.name,
    name,
    description: description || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  database.subcategories.push(newSubcategory);

  res.status(201).json({
    success: true,
    message: 'Subcategory created successfully',
    data: newSubcategory
  });
});

// Update a subcategory
router.put('/:id', async (req, res) => {
  const userId = req.user.id;
  const { name, description, icon, categoryId } = req.body;

  try {
    // Check if subcategory exists
    const subcategory = await prisma.subcategory.findFirst({
      where: { id: req.params.id, userId }
    });

    if (!subcategory) {
      return res.status(404).json({
        success: false,
        message: 'Subcategory not found'
      });
    }

    // Verify new category exists if categoryId is being changed
    if (categoryId && categoryId !== subcategory.categoryId) {
      const category = await prisma.category.findFirst({
        where: { id: categoryId, userId }
      });

      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'New category not found'
        });
      }
    }

    const newCategoryId = categoryId || subcategory.categoryId;

    // Check if new name conflicts with existing subcategory in the same category
    if (name) {
      const existingSubcategory = await prisma.subcategory.findFirst({
        where: {
          name: { mode: 'insensitive', equals: name },
          categoryId: newCategoryId,
          userId,
          id: { not: req.params.id }
        }
      });

      if (existingSubcategory) {
        return res.status(400).json({
          success: false,
          message: 'Subcategory name already exists in this category'
        });
      }
    }

    const updatedSubcategory = await prisma.subcategory.update({
      where: { id: req.params.id },
      data: {
        categoryId: newCategoryId,
        name: name || subcategory.name,
        description: description !== undefined ? description : subcategory.description,
        icon: icon || subcategory.icon
      },
      include: { category: true }
    });

    res.json({
      success: true,
      message: 'Subcategory updated successfully',
      data: updatedSubcategory
    });
  } catch (error) {
    console.error('Error updating subcategory:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update subcategory'
    });
  }
});

// Delete a subcategory
router.delete('/:id', async (req, res) => {
  const userId = req.user.id;

  try {
    // Check if subcategory exists
    const subcategory = await prisma.subcategory.findFirst({
      where: { id: req.params.id, userId },
      include: { _count: { select: { expenses: true } } }
    });

    if (!subcategory) {
      return res.status(404).json({
        success: false,
        message: 'Subcategory not found'
      });
    }

    // Check if subcategory has expenses
    if (subcategory._count.expenses > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete subcategory with existing expenses. Delete expenses first.'
      });
    }

    await prisma.subcategory.delete({
      where: { id: req.params.id }
    });

    res.json({
      success: true,
      message: 'Subcategory deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting subcategory:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete subcategory'
    });
  }
});

module.exports = router;