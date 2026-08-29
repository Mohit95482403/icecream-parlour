const express = require('express');
const router = express.Router();
const adminProductController = require('../controllers/adminProductController');

// All routes here are already protected by requireAdmin in adminRoutes.js

// GET /api/admin/products
router.get('/', adminProductController.getProducts);

// GET /api/admin/products/:id
router.get('/:id', adminProductController.getProductById);

// POST /api/admin/products
router.post('/', adminProductController.createProduct);

// PATCH /api/admin/products/:id
router.patch('/:id', adminProductController.updateProduct);

// PATCH /api/admin/products/:id/status
router.patch('/:id/status', adminProductController.updateProductStatus);

module.exports = router;
