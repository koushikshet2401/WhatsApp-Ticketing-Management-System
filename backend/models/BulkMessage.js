const db = require('../config/database');
const whatsappService = require('../services/whatsappService');

class BulkMessage {
  // Get all bulk messages
  static async getAll(filters = {}, companyId) {
    const { page = 1, limit = 20, status } = filters;
    const offset = (page - 1) * limit;
    
    let query = 'SELECT * FROM bulk_messages WHERE company_id = ?';
    const params = [companyId];
    
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);
    
    const [messages] = await db.execute(query, params);
    return messages;
  }

  // Get by ID with recipients
  static async getById(id, companyId) {
    const [messages] = await db.execute(
      `SELECT bm.*, 
        (SELECT COUNT(*) FROM bulk_message_recipients WHERE bulk_message_id = bm.id) as total_recipients,
        (SELECT COUNT(*) FROM bulk_message_recipients WHERE bulk_message_id = bm.id AND status = 'sent') as sent_count,
        (SELECT COUNT(*) FROM bulk_message_recipients WHERE bulk_message_id = bm.id AND status = 'failed') as failed_count
       FROM bulk_messages bm
       WHERE bm.id = ? AND bm.company_id = ?`,
      [id, companyId]
    );
    return messages[0];
  }

  // Create bulk message
  static async create(data, companyId) {
    const { name, messageContent, templateId, phoneNumberId, createdBy } = data;
    
    const [result] = await db.execute(
      `INSERT INTO bulk_messages 
       (name, message_content, template_id, phone_number_id, created_by, status, company_id) 
       VALUES (?, ?, ?, ?, ?, 'draft', ?)`,
      [name, messageContent, templateId, phoneNumberId, createdBy, companyId]
    );

    return result.insertId;
  }

  // Add recipients to bulk message
  static async addRecipients(bulkMessageId, contactIds) {
    const values = contactIds.map(contactId => [bulkMessageId, contactId]);
    
    await db.query(
      'INSERT INTO bulk_message_recipients (bulk_message_id, contact_id) VALUES ?',
      [values]
    );

    // Update total recipients count
    await db.execute(
      'UPDATE bulk_messages SET total_recipients = ? WHERE id = ?',
      [contactIds.length, bulkMessageId]
    );
  }

  // Send bulk message
  static async send(id, companyId) {
    // Update status to sending
    await db.execute(
      `UPDATE bulk_messages 
       SET status = 'sending', started_at = NOW() 
       WHERE id = ? AND company_id = ?`,
      [id, companyId]
    );

    // Get bulk message details
    const bulkMessage = await this.getById(id, companyId);
    
    // Get all pending recipients
    const [recipients] = await db.execute(
      `SELECT bmr.id, bmr.contact_id, c.phone_number, c.name
       FROM bulk_message_recipients bmr
       JOIN contacts c ON bmr.contact_id = c.id
       WHERE bmr.bulk_message_id = ? AND bmr.status = 'pending'`,
      [id]
    );

    let sentCount = 0;
    let failedCount = 0;

    // Send to each recipient
    for (const recipient of recipients) {
      try {
        // Replace variables if any
        let messageContent = bulkMessage.message_content;
        messageContent = messageContent.replace(/{{name}}/g, recipient.name || 'Customer');

        // Send via WhatsApp
        const response = await whatsappService.sendMessage(
          recipient.phone_number,
          messageContent,
          companyId
        );

        // Update recipient status
        await db.execute(
          `UPDATE bulk_message_recipients 
           SET status = 'sent', whatsapp_message_id = ?, sent_at = NOW() 
           WHERE id = ?`,
          [response.message_id || null, recipient.id]
        );

        sentCount++;
      } catch (error) {
        console.error(`Failed to send to ${recipient.phone_number}:`, error);
        
        await db.execute(
          `UPDATE bulk_message_recipients 
           SET status = 'failed', error_message = ? 
           WHERE id = ?`,
          [error.message, recipient.id]
        );

        failedCount++;
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Update bulk message status
    const finalStatus = failedCount === recipients.length ? 'failed' : 'completed';
    await db.execute(
      `UPDATE bulk_messages 
       SET status = ?, sent_count = ?, failed_count = ?, completed_at = NOW() 
       WHERE id = ? AND company_id = ?`,
      [finalStatus, sentCount, failedCount, id, companyId]
    );

    return {
      sent: sentCount,
      failed: failedCount,
      total: recipients.length
    };
  }

  // Schedule bulk message
  static async schedule(id, scheduledAt, companyId) {
    await db.execute(
      `UPDATE bulk_messages 
       SET status = 'queued', scheduled_at = ? 
       WHERE id = ? AND company_id = ?`,
      [scheduledAt, id, companyId]
    );
  }

  // Cancel bulk message
  static async cancel(id, companyId) {
    await db.execute(
      `UPDATE bulk_messages 
       SET status = 'draft' 
       WHERE id = ? AND company_id = ? AND status IN ('queued', 'draft')`,
      [id, companyId]
    );
  }

  // Delete bulk message
  static async delete(id, companyId) {
    await db.execute('DELETE FROM bulk_messages WHERE id = ? AND company_id = ?', [id, companyId]);
  }

  // Get recipient details
  static async getRecipients(bulkMessageId) {
    const [recipients] = await db.execute(
      `SELECT bmr.*, c.name, c.phone_number, c.email
       FROM bulk_message_recipients bmr
       JOIN contacts c ON bmr.contact_id = c.id
       WHERE bmr.bulk_message_id = ?
       ORDER BY bmr.created_at DESC`,
      [bulkMessageId]
    );
    return recipients;
  }

  // Get statistics
  static async getStats(companyId) {
    const [stats] = await db.execute(`
      SELECT 
        COUNT(*) as total_campaigns,
        SUM(total_recipients) as total_recipients,
        SUM(sent_count) as total_sent,
        SUM(failed_count) as total_failed,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_campaigns
      FROM bulk_messages
      WHERE company_id = ?
    `, [companyId]);
    
    return stats[0];
  }
}

module.exports = BulkMessage;