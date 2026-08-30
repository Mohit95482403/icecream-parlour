const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const { protect } = require('../middleware/authMiddleware');

router.patch('/me', protect, customerController.updateProfile);

module.exports = router;
