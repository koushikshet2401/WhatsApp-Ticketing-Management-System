const BulkMessage = require('../models/BulkMessage');

class BulkMessageController {
  // Get all bulk messages
  static async getAll(req, res) {
    try {
      const { page, limit, status } = req.query;
      
      const messages = await BulkMessage.getAll({
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20,
        status
      }, req.user.companyId);

      res.json({
        success: true,
        data: messages
      });
    } catch (error) {
      console.error('Error fetching bulk messages:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch bulk messages'
      });
    }
  }

  // Get bulk message by ID
  static async getById(req, res) {
    try {
      const message = await BulkMessage.getById(req.params.id, req.user.companyId);
      
      if (!message) {
        return res.status(404).json({
          success: false,
          error: 'Bulk message not found'
        });
      }

      // Get recipients
      const recipients = await BulkMessage.getRecipients(req.params.id);

      res.json({
        success: true,
        data: {
          ...message,
          recipients
        }
      });
    } catch (error) {
      console.error('Error fetching bulk message:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch bulk message'
      });
    }
  }

  // Create bulk message
  static async create(req, res) {
    try {
      const { name, messageContent, templateId, phoneNumberId, contactIds } = req.body;
      
      // Validation
      if (!name || !messageContent) {
        return res.status(400).json({
          success: false,
          error: 'Name and message content are required'
        });
      }

      if (!contactIds || !Array.isArray(contactIds) || contactIds.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'At least one contact is required'
        });
      }

      // Create bulk message
      const bulkMessageId = await BulkMessage.create({
        name,
        messageContent,
        templateId,
        phoneNumberId,
        createdBy: req.user?.id || 1
      }, req.user.companyId);

      // Add recipients
      await BulkMessage.addRecipients(bulkMessageId, contactIds);

      res.status(201).json({
        success: true,
        message: 'Bulk message created successfully',
        data: { id: bulkMessageId }
      });
    } catch (error) {
      console.error('Error creating bulk message:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create bulk message'
      });
    }
  }

  // Send bulk message immediately
  static async send(req, res) {
    try {
      const { id } = req.params;

      // Start sending in background
      BulkMessage.send(id, req.user.companyId).then(result => {
        console.log(`Bulk message ${id} sent:`, result);
      }).catch(error => {
        console.error(`Failed to send bulk message ${id}:`, error);
      });

      res.json({
        success: true,
        message: 'Bulk message sending started'
      });
    } catch (error) {
      console.error('Error sending bulk message:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to send bulk message'
      });
    }
  }

  // Schedule bulk message
  static async schedule(req, res) {
    try {
      const { id } = req.params;
      const { scheduledAt } = req.body;

      if (!scheduledAt) {
        return res.status(400).json({
          success: false,
          error: 'Scheduled date/time is required'
        });
      }

      await BulkMessage.schedule(id, scheduledAt, req.user.companyId);

      res.json({
        success: true,
        message: 'Bulk message scheduled successfully'
      });
    } catch (error) {
      console.error('Error scheduling bulk message:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to schedule bulk message'
      });
    }
  }

  // Cancel bulk message
  static async cancel(req, res) {
    try {
      await BulkMessage.cancel(req.params.id, req.user.companyId);

      res.json({
        success: true,
        message: 'Bulk message cancelled'
      });
    } catch (error) {
      console.error('Error cancelling bulk message:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to cancel bulk message'
      });
    }
  }

  // Delete bulk message
  static async delete(req, res) {
    try {
      await BulkMessage.delete(req.params.id, req.user.companyId);

      res.json({
        success: true,
        message: 'Bulk message deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting bulk message:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete bulk message'
      });
    }
  }

  // Get bulk message statistics
  static async getStats(req, res) {
    try {
      const stats = await BulkMessage.getStats(req.user.companyId);

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error fetching bulk message stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch statistics'
      });
    }
  }

  // Get recipients for a bulk message
  static async getRecipients(req, res) {
    try {
      const recipients = await BulkMessage.getRecipients(req.params.id);

      res.json({
        success: true,
        data: recipients
      });
    } catch (error) {
      console.error('Error fetching recipients:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch recipients'
      });
    }
  }
}

module.exports = BulkMessageController;