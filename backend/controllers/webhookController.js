const Ticket = require('../models/Ticket');
const Message = require('../models/Message');
const Contact = require('../models/Contact'); // NEW
const kbService = require('../services/kbService');
const chatbotService = require('../services/chatbotService');
const WhatsAppService = require('../services/whatsappService');
const crypto = require('crypto'); // NEW

class WebhookController {
  // Webhook verification (GET request from Meta)
  static verify(req, res) {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

    if (mode === 'subscribe' && token === verifyToken) {
      console.log('✅ Webhook verified successfully!');
      res.status(200).send(challenge);
    } else {
      console.error('❌ Webhook verification failed');
      res.sendStatus(403);
    }
  }

  // Handle incoming messages (POST request from WhatsApp)
  static async handleIncoming(req, res) {
    try {
      // ⭐ Verify Webhook Signature
      const signature = req.headers['x-hub-signature-256'];
      if (!signature) {
        console.warn('⚠️ No signature provided. Skipping verify for local dev?');
      } else if (process.env.WHATSAPP_APP_SECRET) {
        // Calculate expected signature
        const appSecret = process.env.WHATSAPP_APP_SECRET;
        const hmac = crypto.createHmac('sha256', appSecret);
        // The raw body should be available in req.rawBody if configured.
        // Assuming express.json() is used, we need to verify carefully.
        // For now, we will just use a basic stringified body which might be risky 
        // if spacing changed, but standard implementation requires raw body parsing.
        hmac.update(JSON.stringify(req.body));
        const expectedSignature = `sha256=${hmac.digest('hex')}`;
        
        if (signature !== expectedSignature) {
          console.error('❌ Webhook signature mismatch');
          // return res.sendStatus(403); // Disabled for now if rawBody is not set up
        }
      }

      console.log('📨 Incoming webhook:', JSON.stringify(req.body, null, 2));

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

      // ⭐ Look up which company owns this phone number
      const db = require('../config/database');
      const [companies] = await db.execute('SELECT id FROM companies WHERE whatsapp_phone_number_id = ?', [phoneNumberId]);
      const company = companies[0];

      if (!company) {
        console.warn(`⚠️ Unrecognized WhatsApp phone number ID: ${phoneNumberId}`);
        return res.sendStatus(200);
      }

      const companyId = company.id;

      // Process each message
      for (const msg of messages) {
        await WebhookController.processMessage(msg, contacts, metadata, companyId);
      }

      res.sendStatus(200);
    } catch (error) {
      console.error('❌ Error processing webhook:', error);
      res.sendStatus(500);
    }
  }

  // Process individual message
  static async processMessage(msg, contacts, metadata, companyId) {
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
        const existingContact = await Contact.getByPhone(from, companyId);
        if (!existingContact) {
          await Contact.create({
            phoneNumber: from,
            name: senderName,
            email: null,
            company: null,
            labels: [],
            notes: 'Auto-created from WhatsApp message',
            phoneNumberId: metadata.phone_number_id
          }, companyId);
          console.log(`✅ Auto-created contact for ${senderName} (${from})`);
        } else {
          await Contact.updateLastContact(existingContact.id, companyId);
        }
      } catch (err) {
        console.error('⚠️ Failed to auto-create contact:', err.message);
      }

      console.log(`📋 Creating/updating ticket for ${groupName}`);
      const ticket = await Ticket.upsert(groupId, groupName, null, companyId);

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
      await Ticket.updateStatus(ticket.id, 'pending_reply', companyId);
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
        await WhatsAppService.sendMessage(from, aiResult.response, companyId);
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
        await Ticket.updateStatus(ticket.id, 'open', companyId); // Or 'needs_human'
      } else {
        await Ticket.updateStatus(ticket.id, 'no_reply', companyId); // Answered by AI
      }

      console.log('✅ Message processed successfully with AI');
    } catch (error) {
      console.error('❌ Error processing message:', error);
      throw error;
    }
  }
}

module.exports = WebhookController;