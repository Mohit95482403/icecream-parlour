const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

// GET /api/products
router.get('/', productController.getProducts);

// GET /api/products/search-suggestions
router.get('/search-suggestions', productController.getSearchSuggestions);

// GET /api/products/best-sellers
router.get('/best-sellers', productController.getBestSellers);

// GET /api/products/new-arrivals
router.get('/new-arrivals', productController.getNewArrivals);

// GET /api/products/:slug/related
router.get('/:slug/related', productController.getRelatedProducts);

// GET /api/products/:slug
router.get('/:slug', productController.getProductBySlug);

module.exports = router;
