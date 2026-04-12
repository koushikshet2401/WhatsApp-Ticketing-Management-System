const db = require('../config/database');

class PhoneNumber {
  // Get all phone numbers
  static async getAll() {
    const [numbers] = await db.execute(
      'SELECT * FROM phone_numbers ORDER BY created_at DESC'
    );
    return numbers;
  }

  // Get active phone numbers only
  static async getActive() {
    const [numbers] = await db.execute(
      'SELECT * FROM phone_numbers WHERE is_active = true ORDER BY created_at DESC'
    );
    return numbers;
  }

  // Get by ID
  static async getById(id) {
    const [numbers] = await db.execute(
      'SELECT * FROM phone_numbers WHERE id = ?',
      [id]
    );
    return numbers[0];
  }

  // Get by phone number
  static async getByNumber(phoneNumber) {
    const [numbers] = await db.execute(
      'SELECT * FROM phone_numbers WHERE phone_number = ?',
      [phoneNumber]
    );
    return numbers[0];
  }

  // Create new phone number
  static async create(data) {
    const { phoneNumber, displayName, whatsappPhoneId, whatsappToken } = data;
    
    const [result] = await db.execute(
      `INSERT INTO phone_numbers 
       (phone_number, display_name, whatsapp_phone_id, whatsapp_token, is_active) 
       VALUES (?, ?, ?, ?, true)`,
      [phoneNumber, displayName, whatsappPhoneId, whatsappToken]
    );

    return {
      id: result.insertId,
      phoneNumber,
      displayName,
      whatsappPhoneId,
      isActive: true
    };
  }

  // Update phone number
  static async update(id, data) {
    const { displayName, whatsappPhoneId, whatsappToken, isActive } = data;
    
    await db.execute(
      `UPDATE phone_numbers 
       SET display_name = ?, 
           whatsapp_phone_id = ?, 
           whatsapp_token = ?,
           is_active = ?,
           updated_at = NOW()
       WHERE id = ?`,
      [displayName, whatsappPhoneId, whatsappToken, isActive, id]
    );
  }

  // Toggle active status
  static async toggleActive(id) {
    await db.execute(
      'UPDATE phone_numbers SET is_active = NOT is_active WHERE id = ?',
      [id]
    );
  }

  // Delete phone number
  static async delete(id) {
    await db.execute('DELETE FROM phone_numbers WHERE id = ?', [id]);
  }

  // Get statistics for a phone number
  static async getStats(id) {
    const [stats] = await db.execute(
      `SELECT 
        COUNT(DISTINCT t.id) as total_tickets,
        COUNT(DISTINCT CASE WHEN t.status = 'open' THEN t.id END) as open_tickets,
        COUNT(DISTINCT CASE WHEN t.status = 'closed' THEN t.id END) as closed_tickets,
        COUNT(m.id) as total_messages
       FROM phone_numbers pn
       LEFT JOIN tickets t ON pn.id = t.phone_number_id
       LEFT JOIN messages m ON pn.id = m.phone_number_id
       WHERE pn.id = ?`,
      [id]
    );
    
    return stats[0];
  }
}

module.exports = PhoneNumber;