/**
 * routes/category.routes.js
 *
 * Public:
 *   GET  /api/categories          – list active categories
 *   GET  /api/categories/:id      – single category
 *
 * Admin only:
 *   POST /api/categories/seed     – insert the 12 default categories
 *   POST /api/categories          – create a category
 *   PUT  /api/categories/:id      – update a category
 *   DELETE /api/categories/:id   – soft-delete a category
 */

const express = require('express');
const {
    getCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory,
    seedCategories,
} = require('../controllers/category.controller');
const { protect, adminOnly } = require('../middleware/auth.middleware');

const router = express.Router();

// Public routes
router.get('/', getCategories);
router.get('/:id', getCategoryById);

// Admin routes
router.post('/seed', protect, adminOnly, seedCategories);
router.post('/', protect, adminOnly, createCategory);
router.put('/:id', protect, adminOnly, updateCategory);
router.delete('/:id', protect, adminOnly, deleteCategory);

module.exports = router;
