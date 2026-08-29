const express = require('express');
const router = express.Router();
const adminCategoryController = require('../controllers/adminCategoryController');

// All routes here are already protected by requireAdmin in adminRoutes.js

// GET /api/admin/categories
router.get('/', adminCategoryController.getCategories);

// POST /api/admin/categories
router.post('/', adminCategoryController.createCategory);

// PATCH /api/admin/categories/:id
router.patch('/:id', adminCategoryController.updateCategory);

// PATCH /api/admin/categories/:id/status
router.patch('/:id/status', adminCategoryController.updateCategoryStatus);

module.exports = router;
