const Staff = require('../models/Staff');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

class AuthController {
  // Register new staff member
  static async register(req, res) {
    try {
      const { name, email, phone, password } = req.body;

      // Validation
      if (!name || !email || !phone || !password) {
        return res.status(400).json({
          success: false,
          error: 'All fields are required'
        });
      }

      // Validate phone number (Indian format)
      const phoneRegex = /^[6-9]\d{9}$/;
      if (!phoneRegex.test(phone)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid phone number. Must be 10 digits starting with 6-9'
        });
      }

      // Validate email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid email address'
        });
      }

      // Validate password
      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          error: 'Password must be at least 6 characters'
        });
      }

      // Check if email already exists
      const existingEmail = await Staff.getByEmail(email);
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          error: 'Email already registered'
        });
      }

      // Check if phone already exists
      const existingPhone = await Staff.getByPhone(phone);
      if (existingPhone) {
        return res.status(400).json({
          success: false,
          error: 'Phone number already registered'
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create staff member
      const staffId = await Staff.create(name, email, phone, hashedPassword);

      // Generate JWT token
      const token = jwt.sign(
        { id: staffId, email, name },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '7d' }
      );

      res.json({
        success: true,
        data: {
          id: staffId,
          name,
          email,
          phone,
          token
        }
      });
    } catch (error) {
      console.error('Error registering staff:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to register staff member'
      });
    }
  }

  // Login
  static async login(req, res) {
    try {
      const { phone, password } = req.body;

      // Validation
      if (!phone || !password) {
        return res.status(400).json({
          success: false,
          error: 'Phone and password are required'
        });
      }

      // Validate phone format
      const phoneRegex = /^[6-9]\d{9}$/;
      if (!phoneRegex.test(phone)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid phone number format'
        });
      }

      // Find staff by phone
      const staff = await Staff.getByPhone(phone);
      if (!staff) {
        return res.status(401).json({
          success: false,
          error: 'Invalid phone number or password'
        });
      }

      // Check if active
      if (!staff.is_active) {
        return res.status(401).json({
          success: false,
          error: 'Account is deactivated'
        });
      }

      // ⭐ Safety check: Verify password exists in database
      if (!staff.password) {
        console.error('❌ Password missing for user ID:', staff.id);
        return res.status(500).json({
          success: false,
          error: 'Account configuration error. Please contact support.'
        });
      }

      // Verify password
      const validPassword = await bcrypt.compare(password, staff.password);
      if (!validPassword) {
        return res.status(401).json({
          success: false,
          error: 'Invalid phone number or password'
        });
      }

      // Generate JWT token
      const token = jwt.sign(
        { id: staff.id, email: staff.email, name: staff.name },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '7d' }
      );

      res.json({
        success: true,
        data: {
          id: staff.id,
          name: staff.name,
          email: staff.email,
          phone: staff.phone,
          token
        }
      });
    } catch (error) {
      console.error('Error logging in:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to login'
      });
    }
  }

  // Get current user (verify token)
  static async getCurrentUser(req, res) {
    try {
      // User is already attached by auth middleware
      const staff = await Staff.getById(req.user.id);

      if (!staff) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      res.json({
        success: true,
        data: {
          id: staff.id,
          name: staff.name,
          email: staff.email,
          phone: staff.phone
        }
      });
    } catch (error) {
      console.error('Error getting current user:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get user data'
      });
    }
  }

  // Change password
  static async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          error: 'Both current and new password are required'
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          error: 'New password must be at least 6 characters'
        });
      }

      // Get current staff
      const staff = await Staff.getByEmail(req.user.email);

      // Verify current password
      const validPassword = await bcrypt.compare(currentPassword, staff.password);
      if (!validPassword) {
        return res.status(401).json({
          success: false,
          error: 'Current password is incorrect'
        });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update password
      await db.execute(
        'UPDATE staff SET password = ? WHERE id = ?',
        [hashedPassword, req.user.id]
      );

      res.json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error) {
      console.error('Error changing password:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to change password'
      });
    }
  }
}

module.exports = AuthController;