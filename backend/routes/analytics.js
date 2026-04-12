const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/AnalyticsController');
// const { authMiddleware } = require('../middleware/auth'); // COMMENTED OUT

// Remove authMiddleware from all routes
router.get('/stats', analyticsController.getStats);
router.get('/charts', analyticsController.getCharts);

module.exports = router;