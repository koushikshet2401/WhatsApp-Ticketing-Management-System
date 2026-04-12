const MessageTemplate = require('../models/MessageTemplate');

class TemplateController {
  // Get all templates
  static async getAll(req, res) {
    try {
      const { phoneNumberId } = req.query;
      const templates = await MessageTemplate.getAll(phoneNumberId);
      
      res.json({
        success: true,
        data: templates
      });
    } catch (error) {
      console.error('Error fetching templates:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch templates'
      });
    }
  }

  // Get templates by category
  static async getByCategory(req, res) {
    try {
      const { category } = req.params;
      const templates = await MessageTemplate.getByCategory(category);
      
      res.json({
        success: true,
        data: templates
      });
    } catch (error) {
      console.error('Error fetching templates by category:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch templates'
      });
    }
  }

  // Get template by ID
  static async getById(req, res) {
    try {
      const template = await MessageTemplate.getById(req.params.id);
      
      if (!template) {
        return res.status(404).json({
          success: false,
          error: 'Template not found'
        });
      }
      
      res.json({
        success: true,
        data: template
      });
    } catch (error) {
      console.error('Error fetching template:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch template'
      });
    }
  }

  // Create template
  static async create(req, res) {
    try {
      const { name, content, category, variables, phoneNumberId } = req.body;
      
      // Validation
      if (!name || !content) {
        return res.status(400).json({
          success: false,
          error: 'Name and content are required'
        });
      }

      const template = await MessageTemplate.create({
        name,
        content,
        category: category || 'general',
        variables,
        phoneNumberId,
        createdBy: req.user?.id || 1 // From auth middleware
      });

      res.status(201).json({
        success: true,
        message: 'Template created successfully',
        data: template
      });
    } catch (error) {
      console.error('Error creating template:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create template'
      });
    }
  }

  // Update template
  static async update(req, res) {
    try {
      const { name, content, category, variables } = req.body;
      
      await MessageTemplate.update(req.params.id, {
        name,
        content,
        category,
        variables
      });

      res.json({
        success: true,
        message: 'Template updated successfully'
      });
    } catch (error) {
      console.error('Error updating template:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update template'
      });
    }
  }

  // Delete template
  static async delete(req, res) {
    try {
      await MessageTemplate.delete(req.params.id);
      
      res.json({
        success: true,
        message: 'Template deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting template:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete template'
      });
    }
  }

  // Use template (increment usage count)
  static async use(req, res) {
    try {
      const { id } = req.params;
      const { variables } = req.body;
      
      const template = await MessageTemplate.getById(id);
      
      if (!template) {
        return res.status(404).json({
          success: false,
          error: 'Template not found'
        });
      }

      // Replace variables
      const message = MessageTemplate.replaceVariables(
        template.content,
        variables || {}
      );

      // Increment usage
      await MessageTemplate.incrementUsage(id);

      res.json({
        success: true,
        data: {
          message,
          template: template.name
        }
      });
    } catch (error) {
      console.error('Error using template:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to use template'
      });
    }
  }

  // Get template statistics
  static async getStats(req, res) {
    try {
      const stats = await MessageTemplate.getStats();
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error fetching template stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch statistics'
      });
    }
  }
}

module.exports = TemplateController;