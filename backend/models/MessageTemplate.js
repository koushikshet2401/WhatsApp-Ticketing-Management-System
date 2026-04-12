const db = require('../config/database');

class MessageTemplate {
  // Get all templates
  static async getAll(phoneNumberId = null) {
    let query = 'SELECT * FROM message_templates WHERE is_active = true';
    const params = [];
    
    if (phoneNumberId) {
      query += ' AND (phone_number_id = ? OR phone_number_id IS NULL)';
      params.push(phoneNumberId);
    }
    
    query += ' ORDER BY usage_count DESC, created_at DESC';
    
    const [templates] = await db.execute(query, params);
    return templates;
  }

  // Get by category
  static async getByCategory(category) {
    const [templates] = await db.execute(
      'SELECT * FROM message_templates WHERE category = ? AND is_active = true ORDER BY name ASC',
      [category]
    );
    return templates;
  }

  // Get by ID
  static async getById(id) {
    const [templates] = await db.execute(
      'SELECT * FROM message_templates WHERE id = ?',
      [id]
    );
    return templates[0];
  }

  // Create template
  static async create(data) {
    const { name, content, category, variables, phoneNumberId, createdBy } = data;
    
    const [result] = await db.execute(
      `INSERT INTO message_templates 
       (name, content, category, variables, phone_number_id, created_by) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, content, category, JSON.stringify(variables || []), phoneNumberId, createdBy]
    );

    return {
      id: result.insertId,
      name,
      content,
      category,
      variables
    };
  }

  // Update template
  static async update(id, data) {
    const { name, content, category, variables } = data;
    
    await db.execute(
      `UPDATE message_templates 
       SET name = ?, content = ?, category = ?, variables = ?, updated_at = NOW()
       WHERE id = ?`,
      [name, content, category, JSON.stringify(variables || []), id]
    );
  }

  // Delete template
  static async delete(id) {
    await db.execute('DELETE FROM message_templates WHERE id = ?', [id]);
  }

  // Increment usage count
  static async incrementUsage(id) {
    await db.execute(
      'UPDATE message_templates SET usage_count = usage_count + 1 WHERE id = ?',
      [id]
    );
  }

  // Replace variables in template
  static replaceVariables(content, variables) {
    let result = content;
    
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, variables[key]);
    });
    
    return result;
  }

  // Get template statistics
  static async getStats() {
    const [stats] = await db.execute(`
      SELECT 
        COUNT(*) as total_templates,
        SUM(usage_count) as total_uses,
        category,
        COUNT(*) as count
      FROM message_templates
      WHERE is_active = true
      GROUP BY category
    `);
    
    return stats;
  }
}

module.exports = MessageTemplate;