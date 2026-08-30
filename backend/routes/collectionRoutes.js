const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');

// GET /api/collections
router.get('/', categoryController.getCollections);

module.exports = router;
