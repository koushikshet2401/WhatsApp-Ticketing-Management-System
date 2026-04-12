const db = require('../config/database');

class Task {
  // Create new task
  static async create(data) {
    const { ticketId, messageId, title, description, assignedTo, deadline } = data;
    
    const [result] = await db.execute(
      `INSERT INTO tasks (ticket_id, message_id, title, description, assigned_to, deadline, status) 
       VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
      [ticketId, messageId || null, title, description, assignedTo || null, deadline || null]
    );
    
    return result.insertId;
  }

  // Get tasks by ticket ID
  static async getByTicketId(ticketId) {
    const [tasks] = await db.execute(
      `SELECT t.*, 
              s.name as assigned_name,
              s.email as assigned_email
       FROM tasks t
       LEFT JOIN staff s ON t.assigned_to = s.id
       WHERE t.ticket_id = ?
       ORDER BY t.created_at DESC`,
      [ticketId]
    );
    return tasks;
  }

  // Get task by ID
  static async getById(taskId) {
    const [tasks] = await db.execute(
      `SELECT t.*, 
              s.name as assigned_name
       FROM tasks t
       LEFT JOIN staff s ON t.assigned_to = s.id
       WHERE t.id = ?`,
      [taskId]
    );
    return tasks[0];
  }

  // Get all pending tasks
  static async getPending() {
    const [tasks] = await db.execute(
      `SELECT t.*, 
              tk.group_name,
              s.name as assigned_name
       FROM tasks t
       JOIN tickets tk ON t.ticket_id = tk.id
       LEFT JOIN staff s ON t.assigned_to = s.id
       WHERE t.status = 'pending'
       ORDER BY t.deadline ASC`
    );
    return tasks;
  }

  // Update task status
  static async updateStatus(taskId, status) {
    const completedAt = status === 'completed' ? new Date() : null;
    
    await db.execute(
      'UPDATE tasks SET status = ?, completed_at = ? WHERE id = ?',
      [status, completedAt, taskId]
    );
  }

  // Update task
  static async update(taskId, data) {
    const fields = [];
    const values = [];

    if (data.title) {
      fields.push('title = ?');
      values.push(data.title);
    }
    if (data.description) {
      fields.push('description = ?');
      values.push(data.description);
    }
    if (data.assignedTo !== undefined) {
      fields.push('assigned_to = ?');
      values.push(data.assignedTo);
    }
    if (data.deadline) {
      fields.push('deadline = ?');
      values.push(data.deadline);
    }

    if (fields.length === 0) return;

    values.push(taskId);
    await db.execute(
      `UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
  }

  // Delete task
  static async delete(taskId) {
    await db.execute('DELETE FROM tasks WHERE id = ?', [taskId]);
  }

  // Get tasks by staff member
  static async getByStaffId(staffId) {
    const [tasks] = await db.execute(
      `SELECT t.*, 
              tk.group_name,
              tk.status as ticket_status
       FROM tasks t
       JOIN tickets tk ON t.ticket_id = tk.id
       WHERE t.assigned_to = ?
       ORDER BY t.deadline ASC, t.created_at DESC`,
      [staffId]
    );
    return tasks;
  }
}

module.exports = Task;