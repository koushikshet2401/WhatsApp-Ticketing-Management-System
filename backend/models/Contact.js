const db = require('../config/database');

class Contact {
  // Get all contacts with pagination and filters
  static async getAll(filters = {}) {
    const { page = 1, limit = 50, search, label, phoneNumberId } = filters;
    const offset = (page - 1) * limit;
    
    let query = 'SELECT * FROM contacts WHERE 1=1';
    const params = [];
    
    // Search filter
    if (search) {
      query += ' AND (name LIKE ? OR phone_number LIKE ? OR email LIKE ? OR company LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }
    
    // Label filter
    if (label) {
      query += ' AND JSON_CONTAINS(labels, ?)';
      params.push(`"${label}"`);
    }
    
    // Phone number filter
    if (phoneNumberId) {
      query += ' AND phone_number_id = ?';
      params.push(phoneNumberId);
    }
    
    // Not blocked
    query += ' AND is_blocked = false';
    
    // Order by recent contact
    query += ' ORDER BY last_contact_at DESC, created_at DESC';
    
    // Pagination
    query += ' LIMIT ? OFFSET ?';
    params.push(String(limit), String(offset));
    
    const [contacts] = await db.execute(query, params);
    
    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM contacts WHERE 1=1';
    const countParams = [...params.slice(0, -2)]; // Remove limit and offset
    
    if (search) {
      countQuery += ' AND (name LIKE ? OR phone_number LIKE ? OR email LIKE ? OR company LIKE ?)';
    }
    if (label) {
      countQuery += ' AND JSON_CONTAINS(labels, ?)';
    }
    if (phoneNumberId) {
      countQuery += ' AND phone_number_id = ?';
    }
    countQuery += ' AND is_blocked = false';
    
    const [countResult] = await db.execute(countQuery, countParams);
    
    return {
      contacts,
      total: countResult[0].total,
      page,
      totalPages: Math.ceil(countResult[0].total / limit)
    };
  }

  // Get by ID
  static async getById(id) {
    const [contacts] = await db.execute(
      'SELECT * FROM contacts WHERE id = ?',
      [id]
    );
    return contacts[0];
  }

  // Get by phone number
  static async getByPhone(phoneNumber) {
    const [contacts] = await db.execute(
      'SELECT * FROM contacts WHERE phone_number = ?',
      [phoneNumber]
    );
    return contacts[0];
  }

  // Create contact
  static async create(data) {
    const { phoneNumber, name, email, company, labels, notes, phoneNumberId } = data;
    
    const [result] = await db.execute(
      `INSERT INTO contacts 
       (phone_number, name, email, company, labels, notes, phone_number_id, last_contact_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [phoneNumber, name, email, company, JSON.stringify(labels || []), notes, phoneNumberId]
    );

    return {
      id: result.insertId,
      phoneNumber,
      name,
      email,
      company,
      labels
    };
  }

  // Update contact
  static async update(id, data) {
    const { name, email, company, labels, notes } = data;
    
    await db.execute(
      `UPDATE contacts 
       SET name = ?, email = ?, company = ?, labels = ?, notes = ?, updated_at = NOW()
       WHERE id = ?`,
      [name, email, company, JSON.stringify(labels || []), notes, id]
    );
  }

  // Add label to contact
  static async addLabel(id, label) {
    await db.execute(
      `UPDATE contacts 
       SET labels = JSON_ARRAY_APPEND(COALESCE(labels, '[]'), '$', ?), updated_at = NOW()
       WHERE id = ? AND NOT JSON_CONTAINS(labels, ?)`,
      [label, id, `"${label}"`]
    );
  }

  // Remove label from contact
  static async removeLabel(id, label) {
    const contact = await this.getById(id);
    if (contact && contact.labels) {
      const labels = JSON.parse(contact.labels);
      const newLabels = labels.filter(l => l !== label);
      
      await db.execute(
        'UPDATE contacts SET labels = ?, updated_at = NOW() WHERE id = ?',
        [JSON.stringify(newLabels), id]
      );
    }
  }

  // Block/unblock contact
  static async toggleBlock(id) {
    await db.execute(
      'UPDATE contacts SET is_blocked = NOT is_blocked WHERE id = ?',
      [id]
    );
  }

  // Update last contact time
  static async updateLastContact(id) {
    await db.execute(
      'UPDATE contacts SET last_contact_at = NOW(), total_messages = total_messages + 1 WHERE id = ?',
      [id]
    );
  }

  // Delete contact
  static async delete(id) {
    await db.execute('DELETE FROM contacts WHERE id = ?', [id]);
  }

  // Get contact statistics
  static async getStats(companyId) {
    const [stats] = await db.execute(`
      SELECT 
        COUNT(*) as total_contacts,
        COUNT(CASE WHEN is_blocked = false THEN 1 END) as active_contacts,
        COUNT(CASE WHEN is_blocked = true THEN 1 END) as blocked_contacts,
        SUM(total_messages) as total_interactions
      FROM contacts
    `, []);
    
    return stats[0];
  }

  // Import contacts from CSV data
  static async bulkImport(contacts, phoneNumberId) {
    const results = {
      success: 0,
      failed: 0,
      errors: []
    };

    for (const contact of contacts) {
      try {
        await this.create({
          phoneNumber: contact.phoneNumber,
          name: contact.name,
          email: contact.email,
          company: contact.company,
          labels: contact.labels || [],
          notes: contact.notes,
          phoneNumberId
        });
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          phone: contact.phoneNumber,
          error: error.message
        });
      }
    }

    return results;
  }
}

module.exports = Contact;