// backend/routes/test.js
// Test routes for WhatsApp functionality

const express = require('express');
const router = express.Router();
const whatsappService = require('../services/whatsappService');

// Test WhatsApp connection
router.get('/whatsapp', async (req, res) => {
  try {
    const result = await whatsappService.testConnection();
    
    res.json({
      success: result.success,
      mode: result.mode,
      message: result.message,
      timestamp: new Date().toISOString(),
      ...(result.data && { connectionData: result.data }),
      ...(result.error && { error: result.error, suggestion: result.suggestion })
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Send a test message
router.post('/whatsapp/send', async (req, res) => {
  try {
    const { to, message } = req.body;

    if (!to || !message) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: to, message'
      });
    }

    // Clean phone number (remove spaces, dashes, plus)
    const cleanPhone = to.replace(/[\s\-\+]/g, '');

    const result = await whatsappService.sendMessage(cleanPhone, message);

    res.json({
      success: result.success,
      messageId: result.messageId,
      timestamp: new Date().toISOString(),
      ...(result.error && { error: result.error })
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Simulate incoming message (simulator mode only)
router.post('/whatsapp/simulate-incoming', async (req, res) => {
  try {
    const simulator = require('../services/whatsappSimulator');
    
    if (process.env.USE_SIMULATOR !== 'true') {
      return res.status(400).json({
        success: false,
        error: 'Simulation mode not enabled. Set USE_SIMULATOR=true in .env'
      });
    }

    const { from, message } = req.body;
    const phoneNumber = from || '919380439747';
    const text = message || 'This is a simulated incoming message';

    // Create webhook data
    const webhookData = {
      object: 'whatsapp_business_account',
      entry: [{
        id: 'sim_entry_' + Date.now(),
        changes: [{
          value: {
            messaging_product: 'whatsapp',
            metadata: {
              display_phone_number: '15550123456',
              phone_number_id: 'sim_phone_id'
            },
            contacts: [{
              profile: { name: 'Simulated Contact' },
              wa_id: phoneNumber
            }],
            messages: [{
              from: phoneNumber,
              id: `sim_msg_${Date.now()}`,
              timestamp: Math.floor(Date.now() / 1000).toString(),
              type: 'text',
              text: { body: text }
            }]
          },
          field: 'messages'
        }]
      }]
    };

    res.json({
      success: true,
      message: 'Simulated message created',
      webhookData,
      note: 'Post this to /api/webhook to process'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get current mode info
router.get('/mode', (req, res) => {
  const useSimulator = process.env.USE_SIMULATOR === 'true' || 
                      !process.env.WHATSAPP_ACCESS_TOKEN ||
                      process.env.WHATSAPP_ACCESS_TOKEN === 'demo_access_token';

  res.json({
    mode: useSimulator ? 'simulator' : 'real',
    simulator: {
      enabled: useSimulator,
      description: useSimulator 
        ? 'Running in simulation mode - no real WhatsApp connection needed'
        : 'Simulation mode disabled - using real WhatsApp API'
    },
    api: {
      configured: !!process.env.WHATSAPP_ACCESS_TOKEN && 
                  process.env.WHATSAPP_ACCESS_TOKEN !== 'demo_access_token',
      phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || 'not set'
    },
    tips: useSimulator ? [
      'Perfect for testing without Meta credentials',
      'Simulates message sending and receiving',
      'Use POST /api/test/whatsapp/simulate-incoming to trigger incoming messages',
      'To use real WhatsApp: Set USE_SIMULATOR=false and add real credentials'
    ] : [
      'Using real WhatsApp Business API',
      'Make sure your phone number is added as test recipient',
      'Access token expires every 24 hours in test mode',
      'Get new tokens at developers.facebook.com'
    ]
  });
});

// Bulk test - send to multiple numbers
router.post('/whatsapp/bulk', async (req, res) => {
  try {
    const { recipients, message } = req.body;

    if (!recipients || !Array.isArray(recipients) || !message) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request. Expected: { recipients: [{phone, name}], message: "..." }'
      });
    }

    const result = await whatsappService.sendBulkMessages(recipients, message);

    res.json({
      success: true,
      sent: result.sent,
      failed: result.failed,
      results: result.results,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'WhatsApp Ticketing System',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      testConnection: 'GET /api/test/whatsapp',
      sendMessage: 'POST /api/test/whatsapp/send',
      simulateIncoming: 'POST /api/test/whatsapp/simulate-incoming',
      checkMode: 'GET /api/test/mode',
      bulkSend: 'POST /api/test/whatsapp/bulk'
    }
  });
});

module.exports = router;