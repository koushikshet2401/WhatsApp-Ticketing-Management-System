require('dotenv').config();

module.exports = {
  apiUrl: process.env.WHATSAPP_API_URL,
  phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
  accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
  verifyToken: process.env.WHATSAPP_VERIFY_TOKEN
};