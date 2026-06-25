const db = require('../config/database');

class Staff {
  // Create new staff member
  static async create(name, email, phone, password, companyId = 1, role = 'agent') {
    const [result] = await db.execute(
      'INSERT INTO staff (name, email, phone, password, company_id, role) VALUES (?, ?, ?, ?, ?, ?)',
      [name, email, phone, password, companyId, role]
    );
    return result.insertId;
  }

  // Get all active staff for a company
  static async getAll(companyId) {
    const [staff] = await db.execute(
      'SELECT id, name, email, phone, is_active, created_at, role FROM staff WHERE is_active = TRUE AND company_id = ? ORDER BY name ASC',
      [companyId]
    );
    return staff;
  }

  // Get by ID
  static async getById(id, companyId) {
    const [staff] = await db.execute(
      'SELECT id, name, email, phone, is_active, company_id, role FROM staff WHERE id = ? AND company_id = ?',
      [id, companyId]
    );
    return staff[0];
  }

  // Get by email (includes password for login)
  static async getByEmail(email) {
    const [staff] = await db.execute(
      'SELECT id, name, email, phone, password, is_active, company_id, role FROM staff WHERE email = ?',
      [email]
    );
    return staff[0];
  }

  // Get by phone (includes password for login)
  static async getByPhone(phone) {
    const [staff] = await db.execute(
      'SELECT id, name, email, phone, password, is_active, company_id, role FROM staff WHERE phone = ?',
      [phone]
    );
    return staff[0];
  }

  // Update staff
  static async update(id, data) {
    const fields = [];
    const values = [];

    if (data.name) {
      fields.push('name = ?');
      values.push(data.name);
    }
    if (data.email) {
      fields.push('email = ?');
      values.push(data.email);
    }
    if (data.phone) {
      fields.push('phone = ?');
      values.push(data.phone);
    }

    if (fields.length === 0) return;

    values.push(id);
    await db.execute(
      `UPDATE staff SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
  }

  // Deactivate staff
  static async deactivate(id, companyId) {
    await db.execute(
      'UPDATE staff SET is_active = FALSE WHERE id = ? AND company_id = ?',
      [id, companyId]
    );
  }
}

module.exports = Staff;