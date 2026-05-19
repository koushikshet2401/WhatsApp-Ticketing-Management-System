// backend/routes/test.js
const express = require('express');
const router = express.Router();

// Test endpoint - simple check
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Test routes are working!',
    timestamp: new Date().toISOString()
  });
});

// Test WhatsApp connection
router.get('/whatsapp', async (req, res) => {
  try {
    const whatsappService = require('../services/whatsappService');
    const result = await whatsappService.testConnection();
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Send test message
router.post('/whatsapp/send', async (req, res) => {
  try {
    const whatsappService = require('../services/whatsappService');
    const { to, message } = req.body;

    if (!to || !message) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: to, message'
      });
    }

    const result = await whatsappService.sendMessage(to, message);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Check mode
router.get('/mode', (req, res) => {
  const useSimulator = process.env.USE_SIMULATOR === 'true';
  
  res.json({
    mode: useSimulator ? 'simulator' : 'real',
    simulator: {
      enabled: useSimulator,
      description: useSimulator 
        ? 'Running in simulation mode'
        : 'Using real WhatsApp API'
    }
  });
});

module.exports = router;