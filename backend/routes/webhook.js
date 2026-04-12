const express = require('express');
const router = express.Router();
const WebhookController = require('../controllers/webhookController');

// GET /webhook - Webhook verification (Meta sends this to verify your endpoint)
router.get('/', WebhookController.verify);

// POST /webhook - Receive incoming messages from WhatsApp
router.post('/', WebhookController.handleIncoming);

module.exports = router;