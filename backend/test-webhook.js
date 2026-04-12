// Test script to simulate incoming WhatsApp messages
// Run: node test-webhook.js

const axios = require('axios');

const BASE_URL = 'http://localhost:8080';

// Simulate incoming WhatsApp message
const simulateIncomingMessage = async () => {
  const webhookPayload = {
    object: 'whatsapp_business_account',
    entry: [
      {
        id: 'WHATSAPP_BUSINESS_ACCOUNT_ID',
        changes: [
          {
            value: {
              messaging_product: 'whatsapp',
              metadata: {
                display_phone_number: '7411024033',
                phone_number_id: '43770345941'
              },
              contacts: [
                {
                  profile: {
                    name: 'Test Customer'
                  },
                  wa_id: '919876543210'
                }
              ],
              messages: [
                {
                  from: '919876543210',
                  id: 'wamid.test123',
                  timestamp: Math.floor(Date.now() / 1000).toString(),
                  type: 'text',
                  text: {
                    body: 'Hello! I need help with my order.'
                  }
                }
              ]
            },
            field: 'messages'
          }
        ]
      }
    ]
  };

  try {
    console.log('📨 Sending test webhook message...\n');
    
    const response = await axios.post(`${BASE_URL}/webhook`, webhookPayload);
    
    console.log('✅ Response:', response.status);
    console.log('\n📋 Now check:');
    console.log('1. Database: SELECT * FROM tickets;');
    console.log('2. Database: SELECT * FROM messages;');
    console.log('3. API: curl http://localhost:8080/api/tickets');
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
};

// Run the test
simulateIncomingMessage();