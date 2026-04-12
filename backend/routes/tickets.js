const express = require('express');
const router = express.Router();
const TicketController = require('../controllers/ticketController');

// ⭐ IMPORTANT: POST / must come BEFORE /:id routes
// Otherwise /:id will catch everything

// POST /api/tickets - Create new ticket
router.post('/', TicketController.create);

// GET /api/tickets - Get all tickets (with optional filter)
router.get('/', TicketController.getAll);

// GET /api/tickets/:id - Get single ticket
router.get('/:id', TicketController.getOne);

// PUT /api/tickets/:id/status - Update ticket status
router.put('/:id/status', TicketController.updateStatus);

// POST /api/tickets/assign - Assign staff to ticket
router.post('/assign', TicketController.assignStaff);

// GET /api/tickets/:ticketId/staff - Get assigned staff
router.get('/:ticketId/staff', TicketController.getAssignedStaff);

module.exports = router;