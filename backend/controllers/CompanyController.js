const db = require('../config/database');

class CompanyController {
  // Get company settings
  static async getSettings(req, res) {
    try {
      const companyId = req.user.companyId;
      const [companies] = await db.execute(
        'SELECT id, name, whatsapp_phone_number_id, whatsapp_access_token, created_at FROM companies WHERE id = ?',
        [companyId]
      );

      if (companies.length === 0) {
        return res.status(404).json({ success: false, error: 'Company not found' });
      }

      const company = companies[0];
      
      // Mask access token for security
      if (company.whatsapp_access_token) {
        const token = company.whatsapp_access_token;
        company.whatsapp_access_token = `${token.substring(0, 10)}...${token.substring(token.length - 5)}`;
      }

      res.json({
        success: true,
        data: company
      });
    } catch (error) {
      console.error('Error fetching company settings:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch company settings' });
    }
  }

  // Update company settings
  static async updateSettings(req, res) {
    try {
      const companyId = req.user.companyId;
      const { whatsapp_phone_number_id, whatsapp_access_token } = req.body;

      // Update fields dynamically
      const updates = [];
      const values = [];

      if (whatsapp_phone_number_id !== undefined) {
        updates.push('whatsapp_phone_number_id = ?');
        values.push(whatsapp_phone_number_id);
      }

      if (whatsapp_access_token !== undefined && !whatsapp_access_token.includes('...')) {
        updates.push('whatsapp_access_token = ?');
        values.push(whatsapp_access_token);
      }

      if (updates.length > 0) {
        values.push(companyId);
        await db.execute(
          `UPDATE companies SET ${updates.join(', ')} WHERE id = ?`,
          values
        );
      }

      res.json({
        success: true,
        message: 'Company settings updated successfully'
      });
    } catch (error) {
      console.error('Error updating company settings:', error);
      res.status(500).json({ success: false, error: 'Failed to update company settings' });
    }
  }
}

module.exports = CompanyController;
