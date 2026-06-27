const db = require('../config/database');

class Ticket {
  // Create or update ticket (upsert)
  static async upsert(groupId, groupName, description = null) {
    const [result] = await db.execute(
      `INSERT INTO tickets (group_id, group_name, description, status, created_at, updated_at) 
       VALUES (?, ?, ?, 'open', NOW(), NOW())
       ON DUPLICATE KEY UPDATE 
         group_name = VALUES(group_name),
         description = COALESCE(VALUES(description), description),
         updated_at = NOW()`,
      [groupId, groupName, description]
    );

    // Get the ticket (either newly created or existing)
    const [tickets] = await db.execute(
      'SELECT * FROM tickets WHERE group_id = ?',
      [groupId]
    );
    return tickets[0];
  }

  // Get ticket by group ID
  static async getByGroupId(groupId) {
    const [tickets] = await db.execute(
      'SELECT * FROM tickets WHERE group_id = ?',
      [groupId]
    );
    return tickets[0];
  }

  // ⭐ Get all tickets with FILTERS
  static async getAll(filter = 'all') {
    try {
      let query;

      if (filter === 'no_reply') {
        // ⭐ Tickets with customer messages but NO staff replies yet
        query = `
          SELECT DISTINCT t.* 
          FROM tickets t
          INNER JOIN messages m ON t.id = m.ticket_id
          WHERE m.is_from_customer = 1
          AND t.id NOT IN (
            SELECT DISTINCT ticket_id 
            FROM messages 
            WHERE is_from_customer = 0
          )
          ORDER BY t.updated_at DESC
        `;
      } else if (filter === 'pending_tasks') {
        // ⭐ Tickets with pending tasks
        query = `
          SELECT DISTINCT t.* 
          FROM tickets t
          INNER JOIN tasks tk ON t.id = tk.ticket_id
          WHERE tk.status = 'pending'
          ORDER BY t.updated_at DESC
        `;
      } else {
        // ⭐ All tickets (default)
        query = 'SELECT * FROM tickets ORDER BY updated_at DESC';
      }

      const [tickets] = await db.execute(query, []);
      return tickets;
    } catch (error) {
      console.error('Error in Ticket.getAll:', error);
      throw error;
    }
  }

  // Get ticket by ID
  static async getById(ticketId) {
    const [tickets] = await db.execute(
      'SELECT * FROM tickets WHERE id = ?',
      [ticketId]
    );
    return tickets[0];
  }

  // Update ticket status
  static async updateStatus(ticketId, status) {
    await db.execute(
      'UPDATE tickets SET status = ?, updated_at = NOW() WHERE id = ?',
      [status, ticketId]
    );
  }

  // Delete ticket
  static async delete(ticketId) {
    await db.execute('DELETE FROM tickets WHERE id = ?', [ticketId]);
  }
}

module.exports = Ticket;