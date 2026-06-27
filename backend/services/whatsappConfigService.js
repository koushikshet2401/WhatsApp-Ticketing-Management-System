const db = require('../config/database');
const axios = require('axios');
const crypto = require('crypto');

const API_VERSION = process.env.WHATSAPP_API_VERSION || 'v18.0';

const ENCRYPTION_KEY = crypto.scryptSync(process.env.JWT_SECRET || 'default_fallback_secret_key_123', 'whatsapp_salt', 32);
const IV_LENGTH = 16;

function encrypt(text) {
  if (!text) return text;
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text) {
  if (!text) return text;
  try {
    const parts = text.split(':');
    if (parts.length !== 2) return text; // Plain text fallback
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedText = Buffer.from(parts[1], 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch (e) {
    return text;
  }
}

/**
 * Get WhatsApp config for a user.
 * Falls back to .env if no DB config exists (backward compatible).
 */
async function getConfig(userId) {
  const [rows] = await db.execute(
    'SELECT * FROM whatsapp_config WHERE user_id = ?',
    [userId]
  );

  if (rows.length > 0 && rows[0].is_configured) {
    return {
      phoneNumberId: rows[0].whatsapp_phone_number_id,
      businessAccountId: rows[0].whatsapp_business_account_id,
      accessToken: decrypt(rows[0].whatsapp_access_token),
      appSecret: decrypt(rows[0].whatsapp_app_secret),
      verifyToken: rows[0].whatsapp_verify_token,
      source: 'database'
    };
  }

  // Fallback to .env (keeps current setup working)
  return {
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID,
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
    appSecret: process.env.WHATSAPP_APP_SECRET,
    verifyToken: process.env.WHATSAPP_VERIFY_TOKEN,
    source: 'env'
  };
}

/**
 * Get config by Phone Number ID (used in webhook when we don't know the user).
 */
async function getConfigByPhoneNumberId(phoneNumberId) {
  const [rows] = await db.execute(
    'SELECT * FROM whatsapp_config WHERE whatsapp_phone_number_id = ? AND is_configured = true',
    [phoneNumberId]
  );

  if (rows.length > 0) {
    return {
      userId: rows[0].user_id,
      phoneNumberId: rows[0].whatsapp_phone_number_id,
      accessToken: decrypt(rows[0].whatsapp_access_token),
      appSecret: decrypt(rows[0].whatsapp_app_secret),
      verifyToken: rows[0].whatsapp_verify_token,
      source: 'database'
    };
  }

  // Fallback: check if it matches the .env phone number ID
  if (phoneNumberId === process.env.WHATSAPP_PHONE_NUMBER_ID) {
    return {
      userId: null, // .env config, no specific user
      phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
      accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
      appSecret: process.env.WHATSAPP_APP_SECRET,
      verifyToken: process.env.WHATSAPP_VERIFY_TOKEN,
      source: 'env'
    };
  }

  return null;
}

/**
 * Save or update WhatsApp config for a user.
 */
async function saveConfig(userId, configData) {
  const {
    whatsapp_phone_number_id,
    whatsapp_business_account_id,
    whatsapp_access_token,
    whatsapp_app_secret,
    whatsapp_verify_token
  } = configData;

  // Generate a unique webhook URL for this user
  const baseUrl = process.env.WEBHOOK_BASE_URL || process.env.API_BASE_URL || 'http://localhost:8080';
  const webhookUrl = `${baseUrl}/api/webhook/whatsapp`;

  await db.execute(
    `INSERT INTO whatsapp_config 
     (user_id, whatsapp_phone_number_id, whatsapp_business_account_id, 
      whatsapp_access_token, whatsapp_app_secret, whatsapp_verify_token, webhook_url, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
     ON DUPLICATE KEY UPDATE 
       whatsapp_phone_number_id = VALUES(whatsapp_phone_number_id),
       whatsapp_business_account_id = VALUES(whatsapp_business_account_id),
       whatsapp_access_token = VALUES(whatsapp_access_token),
       whatsapp_app_secret = VALUES(whatsapp_app_secret),
       whatsapp_verify_token = VALUES(whatsapp_verify_token),
       webhook_url = VALUES(webhook_url),
       is_configured = false,
       updated_at = NOW()`,
    [userId, whatsapp_phone_number_id, whatsapp_business_account_id,
     encrypt(whatsapp_access_token), encrypt(whatsapp_app_secret), whatsapp_verify_token, webhookUrl]
  );

  const [rows] = await db.execute('SELECT * FROM whatsapp_config WHERE user_id = ?', [userId]);
  return rows[0];
}

/**
 * Test the WhatsApp connection using stored credentials.
 */
async function testConnection(userId) {
  const [rows] = await db.execute(
    'SELECT * FROM whatsapp_config WHERE user_id = ?',
    [userId]
  );

  if (rows.length === 0) {
    return { success: false, error: 'No configuration found. Please save your credentials first.' };
  }

  const config = rows[0];

  try {
    // Test 1: Verify access token by fetching phone number details
    const response = await axios.get(
      `https://graph.facebook.com/${API_VERSION}/${config.whatsapp_phone_number_id}`,
      {
        headers: { Authorization: `Bearer ${config.whatsapp_access_token}` },
        params: { fields: 'display_phone_number,verified_name,quality_rating' }
      }
    );

    // If we get here, the token and phone number ID are valid
    // Mark as configured
    await db.execute(
      `UPDATE whatsapp_config 
       SET is_configured = true, configured_at = NOW(), updated_at = NOW() 
       WHERE user_id = ?`,
      [userId]
    );

    return {
      success: true,
      phone_number: response.data.display_phone_number,
      business_name: response.data.verified_name,
      quality: response.data.quality_rating
    };
  } catch (err) {
    const metaError = err.response?.data?.error;
    let errorMessage = 'Connection failed. ';

    if (metaError?.code === 190) {
      errorMessage += 'Invalid or expired Access Token. Generate a new permanent token from Meta Business Settings -> System Users.';
    } else if (metaError?.code === 100) {
      errorMessage += 'Invalid Phone Number ID. Check the value in your Meta App Dashboard -> WhatsApp -> API Setup.';
    } else if (metaError?.code === 4) {
      errorMessage += 'Rate limited by Meta. Wait a minute and try again.';
    } else {
      errorMessage += metaError?.message || err.message;
    }

    return { success: false, error: errorMessage };
  }
}

/**
 * Send a WhatsApp message using DB credentials (replaces your current .env-based sender).
 */
async function sendMessage(userId, to, messageBody) {
  const config = await getConfig(userId);

  if (!config.phoneNumberId || !config.accessToken) {
    throw new Error('WhatsApp not configured. Go to Settings -> WhatsApp Configuration.');
  }

  // Use simulator if configured to demo mode globally
  if (process.env.APP_MODE === 'demo' || process.env.USE_SIMULATOR === 'true') {
    const simulator = require('./whatsappSimulator');
    return await simulator.sendMessage(to, messageBody);
  }

  const response = await axios.post(
    `https://graph.facebook.com/${API_VERSION}/${config.phoneNumberId}/messages`,
    {
      messaging_product: 'whatsapp',
      to: to,
      type: 'text',
      text: { body: messageBody }
    },
    {
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json'
      }
    }
  );

  return response.data;
}

module.exports = {
  getConfig,
  getConfigByPhoneNumberId,
  saveConfig,
  testConnection,
  sendMessage
};
