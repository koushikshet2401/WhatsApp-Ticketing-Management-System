const axios = require('axios');

class WhatsAppService {
  // Send text message
  static async sendMessage(to, message) {
    const url = `${process.env.WHATSAPP_API_URL}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
    
    try {
      console.log(`📤 Sending WhatsApp message to ${to}`);
      
      const response = await axios.post(
        url,
        {
          messaging_product: 'whatsapp',
          to: to,
          type: 'text',
          text: { body: message }
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('✅ Message sent successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Error sending WhatsApp message:', error.response?.data || error.message);
      throw error;
    }
  }

  // Mark message as read
  static async markAsRead(messageId) {
    const url = `${process.env.WHATSAPP_API_URL}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
    
    try {
      await axios.post(
        url,
        {
          messaging_product: 'whatsapp',
          status: 'read',
          message_id: messageId
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('✅ Message marked as read');
    } catch (error) {
      console.error('❌ Error marking message as read:', error.response?.data || error.message);
    }
  }
}

module.exports = WhatsAppService;