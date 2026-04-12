const Task = require('../models/Task');
const Ticket = require('../models/Ticket');

class TaskController {
  // Create new task
  static async create(req, res) {
    try {
      const { ticketId, messageId, title, description, assignedTo, deadline } = req.body;

      // Validation
      if (!ticketId || !title) {
        return res.status(400).json({
          success: false,
          error: 'Ticket ID and title are required'
        });
      }

      // ⭐ Validate ticket exists
      const ticket = await Ticket.getById(ticketId);
      if (!ticket) {
        return res.status(404).json({
          success: false,
          error: `Ticket with ID ${ticketId} not found. Cannot create task.`
        });
      }

      const taskId = await Task.create({
        ticketId,
        messageId,
        title,
        description,
        assignedTo,
        deadline
      });

      res.json({
        success: true,
        data: { 
          id: taskId,
          ticketId,
          title 
        }
      });
    } catch (error) {
      console.error('Error creating task:', error);
      
      // Handle foreign key constraint errors
      if (error.code === 'ER_NO_REFERENCED_ROW_2') {
        return res.status(400).json({
          success: false,
          error: 'Invalid ticket ID or assigned staff ID'
        });
      }
      
      res.status(500).json({
        success: false,
        error: 'Failed to create task'
      });
    }
  }

  // Get tasks by ticket ID
  static async getByTicket(req, res) {
    try {
      const { ticketId } = req.params;

      const tasks = await Task.getByTicketId(ticketId);

      res.json({
        success: true,
        data: tasks
      });
    } catch (error) {
      console.error('Error fetching tasks:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch tasks'
      });
    }
  }

  // Get single task
  static async getOne(req, res) {
    try {
      const { taskId } = req.params;

      const task = await Task.getById(taskId);

      if (!task) {
        return res.status(404).json({
          success: false,
          error: 'Task not found'
        });
      }

      res.json({
        success: true,
        data: task
      });
    } catch (error) {
      console.error('Error fetching task:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch task'
      });
    }
  }

  // Get all pending tasks
  static async getPending(req, res) {
    try {
      const tasks = await Task.getPending();

      res.json({
        success: true,
        data: tasks
      });
    } catch (error) {
      console.error('Error fetching pending tasks:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch pending tasks'
      });
    }
  }

  // Update task status
  static async updateStatus(req, res) {
    try {
      const { taskId } = req.params;
      const { status } = req.body;

      if (!['pending', 'in_progress', 'completed'].includes(status)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid status'
        });
      }

      await Task.updateStatus(taskId, status);

      res.json({
        success: true,
        message: 'Task status updated'
      });
    } catch (error) {
      console.error('Error updating task status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update task status'
      });
    }
  }

  // Update task
  static async update(req, res) {
    try {
      const { taskId } = req.params;
      const updateData = req.body;

      await Task.update(taskId, updateData);

      res.json({
        success: true,
        message: 'Task updated successfully'
      });
    } catch (error) {
      console.error('Error updating task:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update task'
      });
    }
  }

  // Delete task
  static async delete(req, res) {
    try {
      const { taskId } = req.params;

      await Task.delete(taskId);

      res.json({
        success: true,
        message: 'Task deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting task:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete task'
      });
    }
  }

  // Get tasks by staff member
  static async getByStaff(req, res) {
    try {
      const { staffId } = req.params;

      const tasks = await Task.getByStaffId(staffId);

      res.json({
        success: true,
        data: tasks
      });
    } catch (error) {
      console.error('Error fetching staff tasks:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch staff tasks'
      });
    }
  }
}

module.exports = TaskController;