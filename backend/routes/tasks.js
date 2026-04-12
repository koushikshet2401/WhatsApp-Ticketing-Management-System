const express = require('express');
const router = express.Router();
const TaskController = require('../controllers/taskController');
const { validateTask } = require('../middleware/validation');

// POST /api/tasks - Create new task
router.post('/', validateTask, TaskController.create);

// GET /api/tasks/pending - Get all pending tasks
router.get('/pending', TaskController.getPending);

// GET /api/tasks/ticket/:ticketId - Get tasks by ticket ID
router.get('/ticket/:ticketId', TaskController.getByTicket);

// GET /api/tasks/staff/:staffId - Get tasks by staff ID
router.get('/staff/:staffId', TaskController.getByStaff);

// GET /api/tasks/:taskId - Get single task
router.get('/:taskId', TaskController.getOne);

// PUT /api/tasks/:taskId/status - Update task status
router.put('/:taskId/status', TaskController.updateStatus);

// PUT /api/tasks/:taskId - Update task
router.put('/:taskId', TaskController.update);

// DELETE /api/tasks/:taskId - Delete task
router.delete('/:taskId', TaskController.delete);

module.exports = router;