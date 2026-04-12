const express = require('express');
const router = express.Router();
const StaffController = require('../controllers/staffController');

// GET /api/staff - Get all staff members
router.get('/', StaffController.getAll);

// GET /api/staff/:id - Get single staff member
router.get('/:id', StaffController.getOne);

// POST /api/staff - Create new staff member
router.post('/', StaffController.create);

module.exports = router;