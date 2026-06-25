const Message = require('../models/Message');
const Ticket = require('../models/Ticket');
const WhatsAppService = require('../services/whatsappService');

class MessageController {
  // Get messages for a ticket
  static async getMessages(req, res) {
    try {
      const { ticketId } = req.params;

      // Verify ticket belongs to the user's company
      const ticket = await Ticket.getById(ticketId, req.user.companyId);
      if (!ticket) {
        return res.status(404).json({
          success: false,
          error: 'Ticket not found or unauthorized'
        });
      }

      const messages = await Message.getByTicketId(ticketId);

      res.json({
        success: true,
        data: messages
      });
    } catch (error) {
      console.error('Error fetching messages:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch messages'
      });
    }
  }

  // Send reply to customer via WhatsApp
  static async sendReply(req, res) {
    try {
      const { ticketId } = req.params;
      const { message, staffName = 'Support Team' } = req.body;

      // Validation
      if (!message || message.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Message cannot be empty'
        });
      }

      // Get ticket and verify ownership
      const ticket = await Ticket.getById(ticketId, req.user.companyId);
      if (!ticket) {
        return res.status(404).json({
          success: false,
          error: 'Ticket not found'
        });
      }

      // ⭐ Determine recipient (group ID or individual phone)
      let recipientId;
      
      if (ticket.group_id.startsWith('wa_')) {
        // Individual chat - extract phone number (wa_919876543210 → 919876543210)
        recipientId = ticket.group_id.replace('wa_', '');
        console.log(`📤 Sending reply to individual: ${recipientId}`);
      } else {
        // Group chat - use group_id directly
        recipientId = ticket.group_id;
        console.log(`📤 Sending reply to group: ${recipientId}`);
      }

      // Send via WhatsApp API
      const whatsappResponse = await WhatsAppService.sendMessage(recipientId, message.trim(), req.user.companyId);

      // Save reply to database
      const messageId = whatsappResponse.messages?.[0]?.id || `msg_${Date.now()}`;
      await Message.create({
        ticketId: ticketId,
        messageId: messageId,
        senderName: staffName,
        messageText: message.trim(),
        messageType: 'text',
        isFromCustomer: false,
        timestamp: new Date()
      });

      // Update ticket status
      await Ticket.updateStatus(ticketId, 'open', req.user.companyId);

      res.json({
        success: true,
        message: 'Reply sent successfully',
        data: {
          messageId: messageId,
          to: recipientId,
          type: ticket.group_id.startsWith('wa_') ? 'individual' : 'group'
        }
      });
    } catch (error) {
      console.error('Error sending reply:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to send reply',
        details: error.message
      });
    }
  }
}

module.exports = MessageController;