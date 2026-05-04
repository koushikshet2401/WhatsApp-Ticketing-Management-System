const axios = require('axios');

async function testWebhook(question) {
  const payload = {
    "object": "whatsapp_business_account",
    "entry": [
      {
        "id": "123",
        "changes": [
          {
            "value": {
              "messaging_product": "whatsapp",
              "metadata": { "display_phone_number": "123", "phone_number_id": "123" },
              "contacts": [ { "profile": { "name": "Test User" }, "wa_id": "919632123456" } ],
              "messages": [
                {
                  "from": "919632123456",
                  "id": "msg_" + Date.now(),
                  "timestamp": Math.floor(Date.now() / 1000).toString(),
                  "text": { "body": question },
                  "type": "text"
                }
              ]
            },
            "field": "messages"
          }
        ]
      }
    ]
  };

  try {
    console.log(`🧪 Sending question: "${question}"`);
    const response = await axios.post('http://localhost:8080/webhook', payload);
    console.log('✅ Webhook accepted (Status 200)');
  } catch (error) {
    console.error('❌ Webhook error:', error.message);
    if (error.response) console.log('Response data:', error.response.data);
  }
}

async function runTests() {
  await testWebhook("Where is your institute located?");
  console.log('\n--- Waiting 2 seconds ---\n');
  setTimeout(() => {
    testWebhook("Do you offer rocket science courses?");
  }, 2000);
}

runTests();
