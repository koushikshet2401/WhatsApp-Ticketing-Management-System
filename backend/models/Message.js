const db = require('../config/database');

class Message {
  // Create new message
  static async create(data) {
    const {
      ticketId,
      messageId,
      senderName,
      messageText,
      messageType = 'text',
      isFromCustomer = true,
      timestamp = new Date()
    } = data;

    const [result] = await db.execute(
      `INSERT INTO messages 
       (ticket_id, message_id, sender_name, message_text, message_type, is_from_customer, timestamp) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [ticketId, messageId, senderName, messageText, messageType, isFromCustomer, timestamp]
    );

    return result.insertId;
  }

  // Get messages by ticket ID
  static async getByTicketId(ticketId) {
    const [messages] = await db.execute(
      `SELECT * FROM messages 
       WHERE ticket_id = ? 
       ORDER BY timestamp ASC`,
      [ticketId]
    );
    return messages;
  }

  // Get single message
  static async getById(messageId) {
    const [messages] = await db.execute(
      'SELECT * FROM messages WHERE id = ?',
      [messageId]
    );
    return messages[0];
  }

  // Delete message
  static async delete(messageId) {
    await db.execute('DELETE FROM messages WHERE id = ?', [messageId]);
  }
}

module.exports = Message;