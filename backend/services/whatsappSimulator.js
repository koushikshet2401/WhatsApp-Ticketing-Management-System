// backend/services/whatsappSimulator.js
// Mock WhatsApp service for testing without real credentials

class WhatsAppSimulator {
  constructor() {
    this.messageQueue = [];
    this.simulatedContacts = [
      { phone: '919380439747', name: 'Test Customer 1' },
      { phone: '919876543210', name: 'Test Customer 2' },
      { phone: '918765432109', name: 'VIP Customer' },
      { phone: '917654321098', name: 'Support Query' },
      { phone: '916543210987', name: 'New Lead' }
    ];
  }

  // Simulate sending a message
  async sendMessage(to, message) {
    console.log('📤 [SIMULATOR] Sending message:', {
      to,
      message: message.substring(0, 50) + '...',
      timestamp: new Date().toISOString()
    });

    // Simulate API delay
    await this.delay(500);

    const messageId = `sim_msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Store in queue for status tracking
    this.messageQueue.push({
      id: messageId,
      to,
      message,
      status: 'sent',
      timestamp: new Date()
    });

    // Simulate auto-reply after 2-5 seconds
    setTimeout(() => {
      this.simulateIncomingMessage(to);
    }, 2000 + Math.random() * 3000);

    return {
      success: true,
      messageId,
      data: {
        messaging_product: 'whatsapp',
        contacts: [{ input: to, wa_id: to }],
        messages: [{ id: messageId }]
      }
    };
  }

  // Simulate incoming message (webhook)
  async simulateIncomingMessage(from) {
    await this.delay(1000);

    const responses = [
      'Thanks for your message! How can I help you?',
      'I have a question about your services.',
      'Can you provide more information?',
      'Yes, I\'m interested in learning more.',
      'What are your business hours?',
      'I need support with my recent order.',
      'Can I speak to a manager?',
      'This is urgent, please respond quickly.',
      'Thank you for the quick response!',
      'I appreciate your help.'
    ];

    const contact = this.simulatedContacts.find(c => c.phone === from) || 
                   { phone: from, name: 'Unknown Contact' };

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
              profile: { name: contact.name },
              wa_id: from
            }],
            messages: [{
              from: from,
              id: `sim_msg_${Date.now()}`,
              timestamp: Math.floor(Date.now() / 1000).toString(),
              type: 'text',
              text: {
                body: responses[Math.floor(Math.random() * responses.length)]
              }
            }]
          },
          field: 'messages'
        }]
      }]
    };

    console.log('📥 [SIMULATOR] Incoming message:', {
      from,
      message: webhookData.entry[0].changes[0].value.messages[0].text.body,
      timestamp: new Date().toISOString()
    });

    return webhookData;
  }

  // Simulate template message
  async sendTemplate(to, templateName, parameters) {
    console.log('📤 [SIMULATOR] Sending template:', {
      to,
      template: templateName,
      parameters,
      timestamp: new Date().toISOString()
    });

    await this.delay(500);

    const messageId = `sim_template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return {
      success: true,
      messageId,
      data: {
        messaging_product: 'whatsapp',
        contacts: [{ input: to, wa_id: to }],
        messages: [{ id: messageId }]
      }
    };
  }

  // Simulate bulk message sending
  async sendBulkMessages(recipients, message) {
    console.log('📤 [SIMULATOR] Sending bulk messages to', recipients.length, 'recipients');

    const results = [];
    
    for (const recipient of recipients) {
      await this.delay(200); // Simulate rate limiting
      
      const result = await this.sendMessage(recipient.phone, 
        this.replacePlaceholders(message, recipient));
      
      results.push({
        phone: recipient.phone,
        messageId: result.messageId,
        status: 'sent'
      });
    }

    return {
      success: true,
      sent: results.length,
      results
    };
  }

  // Replace placeholders like {{name}}, {{company}}
  replacePlaceholders(message, data) {
    let result = message;
    Object.keys(data).forEach(key => {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), data[key]);
    });
    return result;
  }

  // Get message status
  async getMessageStatus(messageId) {
    const message = this.messageQueue.find(m => m.id === messageId);
    
    if (!message) {
      return { status: 'unknown' };
    }

    // Simulate status progression
    const age = Date.now() - message.timestamp.getTime();
    let status = 'sent';
    
    if (age > 1000) status = 'delivered';
    if (age > 2000) status = 'read';

    return {
      status,
      timestamp: message.timestamp
    };
  }

  // Simulate media upload
  async uploadMedia(file) {
    console.log('📤 [SIMULATOR] Uploading media:', file.name);
    
    await this.delay(1000);

    return {
      success: true,
      mediaId: `sim_media_${Date.now()}`,
      url: `https://simulator.local/media/${file.name}`
    };
  }

  // Helper to simulate network delay
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Generate test data for initial tickets
  generateTestTickets() {
    return [
      {
        from: '919380439747',
        name: 'Test Customer 1',
        message: 'Hi, I need help with my recent order.',
        timestamp: new Date(Date.now() - 3600000) // 1 hour ago
      },
      {
        from: '919876543210',
        name: 'Test Customer 2',
        message: 'What are your business hours?',
        timestamp: new Date(Date.now() - 7200000) // 2 hours ago
      },
      {
        from: '918765432109',
        name: 'VIP Customer',
        message: 'I have an urgent issue that needs immediate attention.',
        timestamp: new Date(Date.now() - 1800000) // 30 mins ago
      }
    ];
  }

  // Simulate webhook verification
  verifyWebhook(mode, token, challenge) {
    console.log('🔐 [SIMULATOR] Webhook verification:', { mode, token });
    
    if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
      return challenge;
    }
    
    return null;
  }
}

module.exports = new WhatsAppSimulator();