const db = require('../config/database');

class Ticket {
  // Create or update ticket (upsert)
  static async upsert(groupId, groupName, description = null, companyId = 1) {
    const [result] = await db.execute(
      `INSERT INTO tickets (group_id, group_name, description, status, created_at, updated_at, company_id) 
       VALUES (?, ?, ?, 'open', NOW(), NOW(), ?)
       ON DUPLICATE KEY UPDATE 
         group_name = VALUES(group_name),
         description = COALESCE(VALUES(description), description),
         updated_at = NOW()`,
      [groupId, groupName, description, companyId]
    );

    // Get the ticket (either newly created or existing)
    const [tickets] = await db.execute(
      'SELECT * FROM tickets WHERE group_id = ? AND company_id = ?',
      [groupId, companyId]
    );
    return tickets[0];
  }

  // Get ticket by group ID
  static async getByGroupId(groupId, companyId) {
    const [tickets] = await db.execute(
      'SELECT * FROM tickets WHERE group_id = ? AND company_id = ?',
      [groupId, companyId]
    );
    return tickets[0];
  }

  // ⭐ Get all tickets with FILTERS
  static async getAll(filter = 'all', companyId) {
    try {
      let query;

      if (filter === 'no_reply') {
        // ⭐ Tickets with customer messages but NO staff replies yet
        query = `
          SELECT DISTINCT t.* 
          FROM tickets t
          INNER JOIN messages m ON t.id = m.ticket_id
          WHERE m.is_from_customer = 1 AND t.company_id = ?
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
          WHERE tk.status = 'pending' AND t.company_id = ?
          ORDER BY t.updated_at DESC
        `;
      } else {
        // ⭐ All tickets (default)
        query = 'SELECT * FROM tickets WHERE company_id = ? ORDER BY updated_at DESC';
      }

      const [tickets] = await db.execute(query, [companyId]);
      return tickets;
    } catch (error) {
      console.error('Error in Ticket.getAll:', error);
      throw error;
    }
  }

  // Get ticket by ID
  static async getById(ticketId, companyId) {
    const [tickets] = await db.execute(
      'SELECT * FROM tickets WHERE id = ? AND company_id = ?',
      [ticketId, companyId]
    );
    return tickets[0];
  }

  // Update ticket status
  static async updateStatus(ticketId, status, companyId) {
    await db.execute(
      'UPDATE tickets SET status = ?, updated_at = NOW() WHERE id = ? AND company_id = ?',
      [status, ticketId, companyId]
    );
  }

  // Delete ticket
  static async delete(ticketId, companyId) {
    await db.execute('DELETE FROM tickets WHERE id = ? AND company_id = ?', [ticketId, companyId]);
  }
}

module.exports = Ticket;