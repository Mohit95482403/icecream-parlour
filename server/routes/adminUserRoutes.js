const express = require('express');
const router = express.Router();
const adminUserController = require('../controllers/adminUserController');
const { requireAdmin } = require('../middleware/adminMiddleware');

router.use(requireAdmin);

router.get('/', adminUserController.getUsers);
router.get('/:id', adminUserController.getUserById);
router.patch('/:id/status', adminUserController.updateUserStatus);

module.exports = router;
