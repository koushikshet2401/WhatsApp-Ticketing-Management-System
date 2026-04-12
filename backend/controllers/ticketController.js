const Ticket = require('../models/Ticket');
const Message = require('../models/Message');
const db = require('../config/database');

class TicketController {
  // ⭐ NEW: Create ticket manually (not from WhatsApp)
  static async create(req, res) {
    try {
      const { groupId, groupName, description } = req.body;

      // Validation
      if (!groupId || !groupName) {
        return res.status(400).json({
          success: false,
          error: 'Group ID and group name are required'
        });
      }

      // Check if ticket already exists
      const existingTicket = await Ticket.getByGroupId(groupId);
      if (existingTicket) {
        return res.status(409).json({
          success: false,
          error: 'Ticket with this group ID already exists',
          data: existingTicket
        });
      }

      // Create ticket
      const ticket = await Ticket.upsert(groupId, groupName, description);

      res.status(201).json({
        success: true,
        message: 'Ticket created successfully',
        data: ticket
      });
    } catch (error) {
      console.error('Error creating ticket:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create ticket'
      });
    }
  }

  // Get all tickets with optional filter
  static async getAll(req, res) {
    try {
      const filter = req.query.filter || 'all'; // all, no_reply, pending_tasks
      const tickets = await Ticket.getAll(filter);
      
      res.json({
        success: true,
        data: tickets
      });
    } catch (error) {
      console.error('Error fetching tickets:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch tickets'
      });
    }
  }

  // Get single ticket with messages
  static async getOne(req, res) {
    try {
      const ticketId = req.params.id;
      
      const ticket = await Ticket.getById(ticketId);
      if (!ticket) {
        return res.status(404).json({
          success: false,
          error: 'Ticket not found'
        });
      }

      const messages = await Message.getByTicketId(ticketId);

      res.json({
        success: true,
        data: {
          ticket,
          messages
        }
      });
    } catch (error) {
      console.error('Error fetching ticket:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch ticket'
      });
    }
  }

  // Update ticket status
  static async updateStatus(req, res) {
    try {
      const ticketId = req.params.id;
      const { status } = req.body;

      if (!['open', 'pending_reply', 'no_reply', 'closed'].includes(status)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid status'
        });
      }

      await Ticket.updateStatus(ticketId, status);

      res.json({
        success: true,
        message: 'Ticket status updated'
      });
    } catch (error) {
      console.error('Error updating ticket:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update ticket'
      });
    }
  }

  // Assign staff to ticket
  static async assignStaff(req, res) {
    try {
      const { ticketId, staffId } = req.body;

      // Validation
      if (!ticketId || !staffId) {
        return res.status(400).json({
          success: false,
          error: 'Ticket ID and Staff ID are required'
        });
      }

      // Check if ticket exists
      const ticket = await Ticket.getById(ticketId);
      if (!ticket) {
        return res.status(404).json({
          success: false,
          error: 'Ticket not found'
        });
      }

      // Insert or update assignment
      await db.execute(
        `INSERT INTO ticket_assignments (ticket_id, staff_id) 
         VALUES (?, ?) 
         ON DUPLICATE KEY UPDATE staff_id = ?, assigned_at = NOW()`,
        [ticketId, staffId, staffId]
      );

      res.json({
        success: true,
        message: 'Staff assigned to ticket successfully'
      });
    } catch (error) {
      console.error('Error assigning staff:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to assign staff to ticket'
      });
    }
  }

  // Get assigned staff for a ticket
  static async getAssignedStaff(req, res) {
    try {
      const { ticketId } = req.params;

      const [assignments] = await db.execute(
        `SELECT s.id, s.name, s.email, ta.assigned_at
         FROM ticket_assignments ta
         JOIN staff s ON ta.staff_id = s.id
         WHERE ta.ticket_id = ?`,
        [ticketId]
      );

      res.json({
        success: true,
        data: assignments
      });
    } catch (error) {
      console.error('Error fetching assigned staff:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch assigned staff'
      });
    }
  }
}

module.exports = TicketController;