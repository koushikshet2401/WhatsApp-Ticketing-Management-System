const express = require('express');
const router = express.Router();
const MessageController = require('../controllers/messageController');

// GET /api/messages/:ticketId - Get messages for a ticket
router.get('/:ticketId', MessageController.getMessages);

// POST /api/messages/:ticketId/reply - Send reply to a ticket
router.post('/:ticketId/reply', MessageController.sendReply);

module.exports = router;