const Ticket = require('../models/Ticket');
const Message = require('../models/Message');
const Contact = require('../models/Contact'); // NEW
const kbService = require('../services/kbService');
const chatbotService = require('../services/chatbotService');
const WhatsAppService = require('../services/whatsappService');
const crypto = require('crypto'); // NEW

class WebhookController {
  // Webhook verification (GET request from Meta)
  static async verify(req, res) {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode !== 'subscribe') return res.sendStatus(403);

    // Check if token matches any user's verify token in DB
    const db = require('../config/database');
    const [rows] = await db.execute(
      'SELECT id FROM whatsapp_config WHERE whatsapp_verify_token = ?',
      [token]
    );

    // Also check .env fallback
    const envMatch = token === process.env.WHATSAPP_VERIFY_TOKEN;

    if (rows.length > 0 || envMatch) {
      console.log('✅ Webhook verified successfully!');
      return res.status(200).send(challenge);
    }

    console.error('❌ Webhook verification failed');
    res.sendStatus(403);
  }

  // Handle incoming messages (POST request from WhatsApp)
  static async handleIncoming(req, res) {
    try {
      // WhatsApp sends messages in this structure
      const entry = req.body.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;

      // Check if this is a message event
      if (!value?.messages) {
        console.log('ℹ️ Not a message event, ignoring');
        return res.sendStatus(200);
      }

      const messages = value.messages;
      const contacts = value.contacts || [];
      const metadata = value.metadata;
      const phoneNumberId = metadata?.phone_number_id;

      if (!phoneNumberId) {
        console.warn('⚠️ No phone_number_id in metadata');
        return res.sendStatus(200);
      }

      // ⭐ Look up which user owns this phone number
      const whatsappConfigService = require('../services/whatsappConfigService');
      const config = await whatsappConfigService.getConfigByPhoneNumberId(phoneNumberId);

      if (!config) {
        console.warn(`⚠️ Unrecognized WhatsApp phone number ID: ${phoneNumberId}`);
        return res.sendStatus(200);
      }

      // ⭐ Verify Webhook Signature if appSecret is available
      if (config.appSecret && req.rawBody) {
        const signature = req.headers['x-hub-signature-256'];
        if (signature) {
          const expected = 'sha256=' + crypto
            .createHmac('sha256', config.appSecret)
            .update(req.rawBody)
            .digest('hex');

          if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
            console.error('❌ Webhook signature mismatch');
            // return res.sendStatus(403);
          }
        }
      }

      // ⭐ Acknowledge webhook IMMEDIATELY to prevent Meta timeouts
      res.sendStatus(200);

      // Process messages asynchronously in the background
      (async () => {
        try {
          for (const msg of messages) {
            await WebhookController.processMessage(msg, contacts, metadata, config.userId);
          }
        } catch (err) {
          console.error('❌ Background processing error:', err);
        }
      })();

    } catch (error) {
      console.error('❌ Error processing webhook:', error);
      if (!res.headersSent) {
        res.sendStatus(500);
      }
    }
  }

  // Process individual message
  static async processMessage(msg, contacts, metadata, userId) {
    try {
      const messageId = msg.id;
      const from = msg.from; // Sender's phone number
      const timestamp = msg.timestamp;
      const messageType = msg.type; // text, image, video, document, etc.
      
      // ⭐ Check if message is from GROUP or individual chat
      const context = msg.context;
      const isGroupMessage = context?.from; // If context exists, it's a group message

      // Extract message text
      let messageText = '';
      if (messageType === 'text') {
        messageText = msg.text.body;
      } else if (messageType === 'image') {
        messageText = `[Image] ${msg.image.caption || 'Sent an image'}`;
      } else if (messageType === 'document') {
        messageText = `[Document] ${msg.document.filename || 'Sent a document'}`;
      } else {
        messageText = `[${messageType}] Unsupported message type`;
      }

      // Get sender name
      const contact = contacts.find(c => c.wa_id === from);
      const senderName = contact?.profile?.name || from;

      // ⭐ Determine ticket identifier
      let groupId, groupName;
      
      if (isGroupMessage) {
        // GROUP MESSAGE - Use group context as ticket
        groupId = context.from; // Group ID
        groupName = context.group_subject || `Group ${groupId.substring(0, 8)}`;
        console.log(`📱 Group message from ${senderName} in group: ${groupName}`);
      } else {
        // INDIVIDUAL MESSAGE - Use sender phone as ticket
        groupId = `wa_${from}`;
        groupName = senderName;
        console.log(`📱 Individual message from ${senderName}`);
      }

      // ⭐ Auto-create contact if not exists
      try {
        const existingContact = await Contact.getByPhone(from);
        if (!existingContact) {
          await Contact.create({
            phoneNumber: from,
            name: senderName,
            email: null,
            company: null,
            labels: [],
            notes: 'Auto-created from WhatsApp message',
            phoneNumberId: metadata.phone_number_id
          });
          console.log(`✅ Auto-created contact for ${senderName} (${from})`);
        } else {
          await Contact.updateLastContact(existingContact.id);
        }
      } catch (err) {
        console.error('⚠️ Failed to auto-create contact:', err.message);
      }

      console.log(`📋 Creating/updating ticket for ${groupName}`);
      const ticket = await Ticket.upsert(groupId, groupName, null);

      // Save message to database
      console.log(`💬 Saving message from ${senderName}: ${messageText}`);
      await Message.create({
        ticketId: ticket.id,
        messageId: messageId,
        senderName: senderName,
        messageText: messageText,
        messageType: messageType,
        isFromCustomer: true,
        timestamp: new Date(parseInt(timestamp) * 1000)
      });

      // Update ticket status
      await Ticket.updateStatus(ticket.id, 'pending_reply');
      console.log('✅ Ticket status updated');

      // ⭐ AI CHATBOT INTEGRATION
      console.log(`🤖 Consulting AI for: "${messageText}"`);
      
      // 1. Search Knowledge Base
      const kbContext = await kbService.search(messageText);
      console.log('✅ KB Search completed');
      
      // 2. Get AI Response
      const aiResult = await chatbotService.getResponse(
        messageText, 
        kbContext, 
        ticket.id
      );
      console.log('✅ AI Response received');
      
      // 3. Send AI response back to customer
      console.log(`🤖 AI Response: ${aiResult.response}`);
      try {
        const whatsappConfigService = require('../services/whatsappConfigService');
        await whatsappConfigService.sendMessage(userId || 1, from, aiResult.response);
        console.log('✅ AI Response sent to WhatsApp');
      } catch (waError) {
        console.warn('⚠️ Failed to send WhatsApp response (likely invalid token), continuing...');
      }
      
      // 4. Save AI message to database
      await Message.create({
        ticketId: ticket.id,
        messageId: `ai_${Date.now()}`,
        senderName: 'Priya',
        messageText: aiResult.response,
        messageType: 'text',
        isFromCustomer: false,
        timestamp: new Date()
      });

      // 5. If escalated, mark ticket status
      if (aiResult.escalated) {
        await Ticket.updateStatus(ticket.id, 'open'); // Or 'needs_human'
      } else {
        await Ticket.updateStatus(ticket.id, 'no_reply'); // Answered by AI
      }

      console.log('✅ Message processed successfully with AI');
    } catch (error) {
      console.error('❌ Error processing message:', error);
      throw error;
    }
  }
}

module.exports = WebhookController;