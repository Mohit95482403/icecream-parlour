const express = require('express');
const router = express.Router();
const adminSettingsController = require('../controllers/adminSettingsController');

router.get('/', adminSettingsController.getSettings);
router.put('/', adminSettingsController.updateSettings);

module.exports = router;
