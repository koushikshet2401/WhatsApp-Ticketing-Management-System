const express = require('express');
const router = express.Router();
const PhoneNumber = require('../models/Phonenumber');
const { authMiddleware } = require('../middleware/auth');
// GET /api/phones - Get all active phone numbers
router.get('/', async (req, res) => {
  try {
    const phones = await PhoneNumber.getActive();
    res.json({
      success: true,
      data: phones
    });
  } catch (error) {
    console.error('Error fetching phones:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch phone numbers'
    });
  }
});

// GET /api/phones/:id - Get specific phone number
router.get('/:id', async (req, res) => {
  try {
    const phone = await PhoneNumber.getById(req.params.id);
    if (!phone) {
      return res.status(404).json({
        success: false,
        error: 'Phone number not found'
      });
    }
    res.json({
      success: true,
      data: phone
    });
  } catch (error) {
    console.error('Error fetching phone:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch phone number'
    });
  }
});

// GET /api/phones/:id/stats - Get statistics for phone number
router.get('/:id/stats', async (req, res) => {
  try {
    const stats = await PhoneNumber.getStats(req.params.id);
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching phone stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics'
    });
  }
});

// POST /api/phones - Create new phone number
router.post('/', async (req, res) => {
  try {
    const { phoneNumber, displayName, whatsappPhoneId, whatsappToken } = req.body;
    
    // Validation
    if (!phoneNumber || !displayName || !whatsappPhoneId || !whatsappToken) {
      return res.status(400).json({
        success: false,
        error: 'All fields are required'
      });
    }

    const phone = await PhoneNumber.create({
      phoneNumber,
      displayName,
      whatsappPhoneId,
      whatsappToken
    });

    res.status(201).json({
      success: true,
      message: 'Phone number added successfully',
      data: phone
    });
  } catch (error) {
    console.error('Error creating phone:', error);
    
    // Check for duplicate phone number
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        success: false,
        error: 'Phone number already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to create phone number'
    });
  }
});

// PUT /api/phones/:id - Update phone number
router.put('/:id', async (req, res) => {
  try {
    const { displayName, whatsappPhoneId, whatsappToken, isActive } = req.body;
    
    await PhoneNumber.update(req.params.id, {
      displayName,
      whatsappPhoneId,
      whatsappToken,
      isActive
    });

    res.json({
      success: true,
      message: 'Phone number updated successfully'
    });
  } catch (error) {
    console.error('Error updating phone:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update phone number'
    });
  }
});

// PATCH /api/phones/:id/toggle - Toggle active status
router.patch('/:id/toggle', async (req, res) => {
  try {
    await PhoneNumber.toggleActive(req.params.id);
    res.json({
      success: true,
      message: 'Phone number status toggled'
    });
  } catch (error) {
    console.error('Error toggling phone status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to toggle phone status'
    });
  }
});

// DELETE /api/phones/:id - Delete phone number
router.delete('/:id', async (req, res) => {
  try {
    await PhoneNumber.delete(req.params.id);
    res.json({
      success: true,
      message: 'Phone number deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting phone:', error);
    
    // Check for foreign key constraint
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete phone number with existing tickets'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to delete phone number'
    });
  }
});

module.exports = router;