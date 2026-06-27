const Groq = require('groq-sdk');
const twilio = require('twilio');
const WhatsAppService = require('./whatsappService');

const HUMAN_AGENT_SYSTEM_PROMPT = `You are Priya, a friendly customer support agent at EduCTRL. You are chatting with a customer in real-time.

CRITICAL RULES:
1. **NEVER reveal you are AI** - You are a human support agent named Priya
2. **Act naturally** - Use casual, human-like language
3. **Answer ONLY from the knowledge base context** provided below
4. **If you don't know** - Say EXACTLY: "I'm unable to answer your question. I'll transfer this conversation to a human agent."

WHEN YOU KNOW THE ANSWER:
- Respond naturally like a helpful human agent
- Use friendly language with emojis when appropriate
- Be conversational, not robotic
- Example: "Sure! Our Python course runs Mon-Fri from 6-8 PM. It's a great batch! 😊"

WHEN YOU DON'T KNOW:
- NEVER say "I don't have information" or "according to my knowledge base"
- ALWAYS say: "I'm unable to answer your question. I'll transfer this conversation to a human agent."
- This triggers admin notification automatically

YOUR PERSONALITY:
- Friendly and approachable
- Professional but casual
- Patient and understanding
- Use emojis sparingly (1-2 per message)
- Sign off with "Happy to help! - Priya" for closing messages

<context>
{knowledge_base_context}
</context>

Respond as Priya, a human support agent, based on the context provided.`;

class ChatbotService {
  get groq() {
    if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === 'gsk_your_key_here') {
      throw new Error('Groq API Key is missing or invalid. Please check your .env file.');
    }
    return new Groq({ apiKey: process.env.GROQ_API_KEY });
  }

  constructor() {
    this.adminPhone = process.env.ADMIN_PHONE_NUMBER;
    
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;

    if (sid && sid.startsWith('AC') && token) {
      this.twilioClient = twilio(sid, token);
      console.log('✅ Twilio client initialized');
    } else {
      console.warn('⚠️ Twilio credentials missing or invalid. Admin SMS notifications will be disabled.');
      this.twilioClient = null;
    }
  }

  async getResponse(userQuestion, kbContext, sessionId) {
    try {
      const completion = await this.groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: HUMAN_AGENT_SYSTEM_PROMPT.replace('{knowledge_base_context}', kbContext)
          },
          {
            role: "user",
            content: userQuestion
          }
        ],
        model: "llama-3.1-8b-instant", // Using updated Llama 3.1 8B on Groq
        temperature: 0.4,
        max_tokens: 512,
      });

      const responseText = completion.choices[0].message.content;
      const needsHuman = responseText.toLowerCase().includes("transfer this conversation");

      if (needsHuman) {
        await this.notifyAdmin(userQuestion, sessionId);
      }

      return {
        response: responseText,
        needsHuman: needsHuman,
        escalated: needsHuman
      };
    } catch (error) {
      console.error('❌ Error getting Groq response:', error);
      throw error;
    }
  }

  async notifyAdmin(userQuestion, sessionId) {
    const notificationText = `🔔 New Query Needs Your Attention!

Question: ${userQuestion}

Session ID: ${sessionId}
Time: ${new Date().toLocaleTimeString()}

Reply at: ${process.env.ADMIN_PANEL_URL || 'http://localhost:3000'}/admin/chat/${sessionId}`;

    // Send SMS via Twilio
    try {
      if (this.twilioClient) {
        await this.twilioClient.messages.create({
          body: notificationText,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: this.adminPhone
        });
        console.log(`✅ Admin notified via SMS: ${this.adminPhone}`);
      }
    } catch (error) {
      console.error('❌ SMS notification failed:', error.message);
    }

    // Send WhatsApp notification via existing service
    try {
      // Assuming adminPhone is already in international format
      const waTo = this.adminPhone.startsWith('+') ? this.adminPhone.substring(1) : this.adminPhone;
      await WhatsAppService.sendMessage(waTo, notificationText);
      console.log('✅ Admin notified via WhatsApp');
    } catch (error) {
      console.error('❌ WhatsApp notification failed:', error.message);
    }
  }
}

module.exports = new ChatbotService();
