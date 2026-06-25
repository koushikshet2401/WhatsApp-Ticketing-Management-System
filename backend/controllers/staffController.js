const db = require('../config/database');

class StaffController {
  // Get all active staff members
  static async getAll(req, res) {
    try {
      const [staff] = await db.execute(
        'SELECT id, name, email, phone, is_active, created_at, role FROM staff WHERE is_active = TRUE AND company_id = ? ORDER BY name ASC',
        [req.user.companyId]
      );
      
      res.json({
        success: true,
        data: staff
      });
    } catch (error) {
      console.error('Error fetching staff:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch staff members'
      });
    }
  }

  // Create new staff member
  static async create(req, res) {
    try {
      const { name, email, phone } = req.body;

      // Validation
      if (!name || !email) {
        return res.status(400).json({
          success: false,
          error: 'Name and email are required'
        });
      }

      const [result] = await db.execute(
        'INSERT INTO staff (name, email, phone, company_id, role, password) VALUES (?, ?, ?, ?, ?, ?)',
        [name, email, phone, req.user.companyId, 'agent', '$2b$10$K7L1OJ45M7fRj1nH5.DsE.sFzZpG3EbZ0yLJp7QZp5L8XRZ0jKB3e'] // Default 'password123'
      );

      res.json({
        success: true,
        data: {
          id: result.insertId,
          name,
          email,
          phone
        }
      });
    } catch (error) {
      console.error('Error creating staff:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create staff member'
      });
    }
  }

  // Get single staff member
  static async getOne(req, res) {
    try {
      const { id } = req.params;

      const [staff] = await db.execute(
        'SELECT id, name, email, phone, is_active, role FROM staff WHERE id = ? AND company_id = ?',
        [id, req.user.companyId]
      );

      if (staff.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Staff member not found'
        });
      }

      res.json({
        success: true,
        data: staff[0]
      });
    } catch (error) {
      console.error('Error fetching staff member:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch staff member'
      });
    }
  }
}

module.exports = StaffController;