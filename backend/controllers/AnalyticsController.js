const db = require('../config/database');

class AnalyticsController {
  // Get overall statistics
  static async getStats(req, res) {
    try {
      // Total tickets
      const [tickets] = await db.execute(
        'SELECT COUNT(*) as total FROM tickets'
      );

      // Open tickets
      const [open] = await db.execute(
        "SELECT COUNT(*) as count FROM tickets WHERE status IN ('open', 'pending_reply', 'no_reply')"
      );

      // Closed tickets
      const [closed] = await db.execute(
        "SELECT COUNT(*) as count FROM tickets WHERE status = 'closed'"
      );

      // Total messages
      const [messages] = await db.execute(
        'SELECT COUNT(*) as total FROM messages'
      );

      // Average response time (simplified)
      const avgResponseTime = '5m 30s'; // Calculate from actual data

      // Active phone numbers
      const [phones] = await db.execute(
        'SELECT COUNT(*) as count FROM whatsapp_config WHERE is_active = true'
      );

      res.json({
        success: true,
        data: {
          totalTickets: tickets[0].total,
          openTickets: open[0].count,
          closedTickets: closed[0].count,
          totalMessages: messages[0].total,
          avgResponseTime,
          activePhones: phones[0].count,
        }
      });
    } catch (error) {
      console.error('Error getting stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch statistics'
      });
    }
  }

  // Get chart data
  static async getCharts(req, res) {
    try {
      // Messages per day (last 7 days)
      const [dailyMessages] = await db.execute(`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as messages
        FROM messages
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `);

      // Tickets by status
      const [byStatus] = await db.execute(`
        SELECT 
          CASE 
            WHEN status = 'open' THEN 'Open'
            WHEN status = 'pending_reply' THEN 'Pending'
            WHEN status = 'no_reply' THEN 'No Reply'
            WHEN status = 'closed' THEN 'Closed'
            ELSE 'Other'
          END as name,
          COUNT(*) as value
        FROM tickets
        GROUP BY status
      `);

      // Performance by phone number
      const [byPhone] = await db.execute(`
        SELECT 
          pn.phone_number_id as name,
          COUNT(DISTINCT t.id) as tickets,
          COUNT(m.id) as messages
        FROM whatsapp_config pn
        LEFT JOIN tickets t ON pn.id = t.company_id
        LEFT JOIN messages m ON t.id = m.ticket_id
        WHERE pn.is_active = true
        GROUP BY pn.id, pn.phone_number_id
      `);

      res.json({
        success: true,
        data: {
          daily: dailyMessages.map(row => ({
            date: new Date(row.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            messages: row.messages
          })),
          byStatus,
          byPhone: byPhone.length > 0 ? byPhone : [{ name: 'No Data', tickets: 0, messages: 0 }]
        }
      });
    } catch (error) {
      console.error('Error getting charts:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch chart data'
      });
    }
  }
}

module.exports = AnalyticsController;