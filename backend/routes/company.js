const express = require('express');
const router = express.Router();
const { authMiddleware, requireAdmin } = require('../middleware/auth');
const CompanyController = require('../controllers/CompanyController');

// All company routes require authentication
router.use(authMiddleware);

// Get current company settings
router.get('/settings', requireAdmin, CompanyController.getSettings);

// Update company settings (WhatsApp credentials)
router.put('/settings', requireAdmin, CompanyController.updateSettings);

module.exports = router;
