const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const whatsappConfig = require('../services/whatsappConfigService');
const db = require('../config/database');

// Get current config for logged-in user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT whatsapp_phone_number_id, whatsapp_business_account_id,
              whatsapp_verify_token, webhook_url, is_configured, is_active, configured_at
       FROM whatsapp_config WHERE user_id = ?`,
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.json({ configured: false, config: null });
    }

    // Never send access_token or app_secret back to frontend
    const config = rows[0];
    return res.json({
      configured: !!config.is_configured,
      active: !!config.is_active,
      config: {
        whatsapp_phone_number_id: config.whatsapp_phone_number_id,
        whatsapp_business_account_id: config.whatsapp_business_account_id,
        whatsapp_verify_token: config.whatsapp_verify_token,
        webhook_url: config.webhook_url,
        configured_at: config.configured_at
      }
    });
  } catch (err) {
    console.error('Error fetching WA config:', err);
    res.status(500).json({ error: 'Failed to fetch configuration' });
  }
});

// Save credentials
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { 
      whatsapp_phone_number_id,
      whatsapp_business_account_id,
      whatsapp_access_token,
      whatsapp_app_secret,
      whatsapp_verify_token
    } = req.body;

    // Basic validation
    if (!whatsapp_phone_number_id || !whatsapp_access_token) {
      return res.status(400).json({ 
        error: 'Phone Number ID and Access Token are required.' 
      });
    }

    const saved = await whatsappConfig.saveConfig(req.user.id, {
      whatsapp_phone_number_id,
      whatsapp_business_account_id,
      whatsapp_access_token,
      whatsapp_app_secret,
      whatsapp_verify_token
    });

    res.json({
      success: true,
      message: 'Credentials saved. Click "Test Connection" to verify.',
      webhook_url: saved.webhook_url
    });
  } catch (err) {
    console.error('Error saving WA config:', err);
    res.status(500).json({ error: 'Failed to save configuration' });
  }
});

// Test connection
router.post('/test', authMiddleware, async (req, res) => {
  try {
    const result = await whatsappConfig.testConnection(req.user.id);
    res.json(result);
  } catch (err) {
    console.error('Error testing WA connection:', err);
    res.status(500).json({ success: false, error: 'Test failed: ' + err.message });
  }
});

module.exports = router;
