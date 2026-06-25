const Contact = require('../models/Contact');

class ContactController {
  // Get all contacts with filters
  static async getAll(req, res) {
    try {
      const { page, limit, search, label, phoneNumberId } = req.query;
      
      const result = await Contact.getAll({
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 50,
        search,
        label,
        phoneNumberId
      }, req.user.companyId);

      res.json({
        success: true,
        data: result.contacts,
        pagination: {
          page: result.page,
          totalPages: result.totalPages,
          total: result.total
        }
      });
    } catch (error) {
      console.error('Error fetching contacts:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch contacts'
      });
    }
  }

  // Get contact by ID
  static async getById(req, res) {
    try {
      const contact = await Contact.getById(req.params.id, req.user.companyId);
      
      if (!contact) {
        return res.status(404).json({
          success: false,
          error: 'Contact not found'
        });
      }

      res.json({
        success: true,
        data: contact
      });
    } catch (error) {
      console.error('Error fetching contact:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch contact'
      });
    }
  }

  // Create contact
  static async create(req, res) {
    try {
      const { phoneNumber, name, email, company, labels, notes, phoneNumberId } = req.body;
      
      // Validation
      if (!phoneNumber) {
        return res.status(400).json({
          success: false,
          error: 'Phone number is required'
        });
      }

      // Check if contact already exists
      const existing = await Contact.getByPhone(phoneNumber, req.user.companyId);
      if (existing) {
        return res.status(400).json({
          success: false,
          error: 'Contact with this phone number already exists'
        });
      }

      const contact = await Contact.create({
        phoneNumber,
        name,
        email,
        company,
        labels,
        notes,
        phoneNumberId
      }, req.user.companyId);

      res.status(201).json({
        success: true,
        message: 'Contact created successfully',
        data: contact
      });
    } catch (error) {
      console.error('Error creating contact:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create contact'
      });
    }
  }

  // Update contact
  static async update(req, res) {
    try {
      const { name, email, company, labels, notes } = req.body;
      
      await Contact.update(req.params.id, {
        name,
        email,
        company,
        labels,
        notes
      }, req.user.companyId);

      res.json({
        success: true,
        message: 'Contact updated successfully'
      });
    } catch (error) {
      console.error('Error updating contact:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update contact'
      });
    }
  }

  // Add label to contact
  static async addLabel(req, res) {
    try {
      const { label } = req.body;
      
      if (!label) {
        return res.status(400).json({
          success: false,
          error: 'Label is required'
        });
      }

      await Contact.addLabel(req.params.id, label, req.user.companyId);

      res.json({
        success: true,
        message: 'Label added successfully'
      });
    } catch (error) {
      console.error('Error adding label:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to add label'
      });
    }
  }

  // Remove label from contact
  static async removeLabel(req, res) {
    try {
      const { label } = req.body;
      
      if (!label) {
        return res.status(400).json({
          success: false,
          error: 'Label is required'
        });
      }

      await Contact.removeLabel(req.params.id, label, req.user.companyId);

      res.json({
        success: true,
        message: 'Label removed successfully'
      });
    } catch (error) {
      console.error('Error removing label:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to remove label'
      });
    }
  }

  // Toggle block status
  static async toggleBlock(req, res) {
    try {
      await Contact.toggleBlock(req.params.id, req.user.companyId);

      res.json({
        success: true,
        message: 'Contact block status updated'
      });
    } catch (error) {
      console.error('Error toggling block:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update block status'
      });
    }
  }

  // Delete contact
  static async delete(req, res) {
    try {
      await Contact.delete(req.params.id, req.user.companyId);

      res.json({
        success: true,
        message: 'Contact deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting contact:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete contact'
      });
    }
  }

  // Bulk import contacts
  static async bulkImport(req, res) {
    try {
      const { contacts, phoneNumberId } = req.body;
      
      if (!Array.isArray(contacts) || contacts.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Contacts array is required'
        });
      }

      const results = await Contact.bulkImport(contacts, phoneNumberId, req.user.companyId);

      res.json({
        success: true,
        message: `Imported ${results.success} contacts, ${results.failed} failed`,
        data: results
      });
    } catch (error) {
      console.error('Error importing contacts:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to import contacts'
      });
    }
  }

  // Get contact statistics
  static async getStats(req, res) {
    try {
      const stats = await Contact.getStats(req.user.companyId);

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error fetching contact stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch statistics'
      });
    }
  }
}

module.exports = ContactController;