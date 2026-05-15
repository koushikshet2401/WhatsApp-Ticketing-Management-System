// backend/services/whatsappService.js
// Unified WhatsApp service that switches between real API and simulator

const axios = require('axios');
const simulator = require('./whatsappSimulator');

class WhatsAppService {
  constructor() {
    // Check if we should use simulation mode
    this.useSimulator = process.env.USE_SIMULATOR === 'true' || 
                       !process.env.WHATSAPP_ACCESS_TOKEN ||
                       process.env.WHATSAPP_ACCESS_TOKEN === 'demo_access_token';

    this.apiUrl = process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v18.0';
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

    if (this.useSimulator) {
      console.log('🎭 WhatsApp Service: Running in SIMULATION MODE');
      console.log('   To use real WhatsApp API, set USE_SIMULATOR=false in .env');
    } else {
      console.log('📱 WhatsApp Service: Using REAL WhatsApp API');
      console.log('   Phone Number ID:', this.phoneNumberId);
    }
  }

  // Send a text message
  async sendMessage(to, message, ticketId = null) {
    try {
      // Use simulator if enabled
      if (this.useSimulator) {
        return await simulator.sendMessage(to, message);
      }

      // Use real WhatsApp API
      const url = `${this.apiUrl}/${this.phoneNumberId}/messages`;
      
      const response = await axios.post(url, {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: to,
        type: 'text',
        text: {
          preview_url: false,
          body: message
        }
      }, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      return {
        success: true,
        messageId: response.data.messages[0].id,
        data: response.data
      };

    } catch (error) {
      console.error('❌ WhatsApp send error:', error.response?.data || error.message);
      
      // If real API fails, suggest using simulator
      if (!this.useSimulator) {
        console.log('💡 Tip: Set USE_SIMULATOR=true in .env to test without real credentials');
      }

      return {
        success: false,
        error: error.response?.data?.error?.message || error.message
      };
    }
  }

  // Send a template message
  async sendTemplate(to, templateName, languageCode = 'en', parameters = []) {
    try {
      if (this.useSimulator) {
        return await simulator.sendTemplate(to, templateName, parameters);
      }

      const url = `${this.apiUrl}/${this.phoneNumberId}/messages`;
      
      const response = await axios.post(url, {
        messaging_product: 'whatsapp',
        to: to,
        type: 'template',
        template: {
          name: templateName,
          language: {
            code: languageCode
          },
          components: parameters.length > 0 ? [{
            type: 'body',
            parameters: parameters.map(param => ({
              type: 'text',
              text: param
            }))
          }] : []
        }
      }, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      return {
        success: true,
        messageId: response.data.messages[0].id,
        data: response.data
      };

    } catch (error) {
      console.error('❌ WhatsApp template error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message
      };
    }
  }

  // Send bulk messages
  async sendBulkMessages(recipients, message) {
    if (this.useSimulator) {
      return await simulator.sendBulkMessages(recipients, message);
    }

    const results = [];
    
    for (const recipient of recipients) {
      // Add delay to respect rate limits (80 msg/sec for WhatsApp)
      await this.delay(20);
      
      const personalizedMessage = this.replacePlaceholders(message, recipient);
      const result = await this.sendMessage(recipient.phone, personalizedMessage);
      
      results.push({
        phone: recipient.phone,
        success: result.success,
        messageId: result.messageId,
        error: result.error
      });
    }

    const successful = results.filter(r => r.success).length;
    
    return {
      success: true,
      sent: successful,
      failed: results.length - successful,
      results
    };
  }

  // Send media (image, document, etc.)
  async sendMedia(to, mediaType, mediaUrl, caption = null) {
    try {
      if (this.useSimulator) {
        return await simulator.sendMessage(to, `[${mediaType.toUpperCase()}] ${caption || 'Media file'}`);
      }

      const url = `${this.apiUrl}/${this.phoneNumberId}/messages`;
      
      const payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: to,
        type: mediaType,
        [mediaType]: {
          link: mediaUrl
        }
      };

      if (caption && ['image', 'document', 'video'].includes(mediaType)) {
        payload[mediaType].caption = caption;
      }

      const response = await axios.post(url, payload, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      return {
        success: true,
        messageId: response.data.messages[0].id,
        data: response.data
      };

    } catch (error) {
      console.error('❌ WhatsApp media error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message
      };
    }
  }

  // Mark message as read
  async markAsRead(messageId) {
    try {
      if (this.useSimulator) {
        console.log('✓ [SIMULATOR] Message marked as read:', messageId);
        return { success: true };
      }

      const url = `${this.apiUrl}/${this.phoneNumberId}/messages`;
      
      await axios.post(url, {
        messaging_product: 'whatsapp',
        status: 'read',
        message_id: messageId
      }, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      return { success: true };

    } catch (error) {
      console.error('❌ Mark as read error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message
      };
    }
  }

  // Verify webhook challenge
  verifyWebhook(mode, token, challenge) {
    if (this.useSimulator) {
      return simulator.verifyWebhook(mode, token, challenge);
    }

    const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;
    
    if (mode === 'subscribe' && token === verifyToken) {
      console.log('✓ Webhook verified successfully');
      return challenge;
    }
    
    console.error('❌ Webhook verification failed');
    return null;
  }

  // Process incoming webhook
  async processWebhook(webhookData) {
    try {
      const entry = webhookData.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;

      if (!value) {
        return { success: false, error: 'Invalid webhook data' };
      }

      // Extract message data
      const messages = value.messages || [];
      const contacts = value.contacts || [];
      const statuses = value.statuses || [];

      // Process incoming messages
      const processedMessages = messages.map(message => {
        const contact = contacts.find(c => c.wa_id === message.from);
        
        return {
          messageId: message.id,
          from: message.from,
          contactName: contact?.profile?.name || 'Unknown',
          timestamp: new Date(parseInt(message.timestamp) * 1000),
          type: message.type,
          text: message.text?.body || null,
          media: this.extractMediaInfo(message),
          replyTo: message.context?.id || null
        };
      });

      // Process status updates
      const processedStatuses = statuses.map(status => ({
        messageId: status.id,
        status: status.status,
        timestamp: new Date(parseInt(status.timestamp) * 1000),
        recipientId: status.recipient_id
      }));

      return {
        success: true,
        messages: processedMessages,
        statuses: processedStatuses
      };

    } catch (error) {
      console.error('❌ Webhook processing error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Extract media information from message
  extractMediaInfo(message) {
    const mediaTypes = ['image', 'video', 'audio', 'document', 'sticker'];
    
    for (const type of mediaTypes) {
      if (message[type]) {
        return {
          type,
          id: message[type].id,
          mimeType: message[type].mime_type,
          caption: message[type].caption || null,
          filename: message[type].filename || null
        };
      }
    }
    
    return null;
  }

  // Replace placeholders in message
  replacePlaceholders(message, data) {
    let result = message;
    Object.keys(data).forEach(key => {
      const placeholder = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(placeholder, data[key] || '');
    });
    return result;
  }

  // Helper delay function
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Test connection
  async testConnection() {
    try {
      if (this.useSimulator) {
        console.log('✓ Simulator mode active - connection OK');
        return {
          success: true,
          mode: 'simulator',
          message: 'Running in simulation mode - no real WhatsApp connection needed'
        };
      }

      // Test real API connection
      const url = `${this.apiUrl}/${this.phoneNumberId}`;
      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      });

      console.log('✓ WhatsApp API connection successful');
      return {
        success: true,
        mode: 'real',
        message: 'Connected to WhatsApp Business API',
        data: response.data
      };

    } catch (error) {
      console.error('❌ Connection test failed:', error.response?.data || error.message);
      return {
        success: false,
        mode: this.useSimulator ? 'simulator' : 'real',
        error: error.response?.data?.error?.message || error.message,
        suggestion: 'Consider setting USE_SIMULATOR=true in .env for testing'
      };
    }
  }
}

module.exports = new WhatsAppService();