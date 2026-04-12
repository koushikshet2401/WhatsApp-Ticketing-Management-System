import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Tickets API
export const ticketsAPI = {
  // Get all tickets with optional filter
  getAll: async (filter = 'all') => {
    const response = await api.get(`/api/tickets?filter=${filter}`);
    return response.data;
  },

  // Get single ticket with messages
  getOne: async (ticketId) => {
    const response = await api.get(`/api/tickets/${ticketId}`);
    return response.data;
  },

  // Update ticket status
  updateStatus: async (ticketId, status) => {
    const response = await api.put(`/api/tickets/${ticketId}/status`, { status });
    return response.data;
  },

  // ⭐ NEW: Assign staff to ticket
  assignStaff: async (ticketId, staffId) => {
    const response = await api.post('/api/tickets/assign', { ticketId, staffId });
    return response.data;
  },

  // ⭐ NEW: Get assigned staff for ticket
  getAssignedStaff: async (ticketId) => {
    const response = await api.get(`/api/tickets/${ticketId}/staff`);
    return response.data;
  },
};

// Messages API
export const messagesAPI = {
  // Get messages for a ticket
  getMessages: async (ticketId) => {
    const response = await api.get(`/api/messages/${ticketId}`);
    return response.data;
  },

  // Send reply to a ticket
  sendReply: async (ticketId, message, staffName = 'Staff') => {
    const response = await api.post(`/api/messages/${ticketId}/reply`, {
      message,
      staffName,
    });
    return response.data;
  },
};

// ⭐ NEW: Staff API
export const staffAPI = {
  // Get all staff members
  getAll: async () => {
    const response = await api.get('/api/staff');
    return response.data;
  },

  // Get single staff member
  getOne: async (staffId) => {
    const response = await api.get(`/api/staff/${staffId}`);
    return response.data;
  },

  // Create new staff member
  create: async (staffData) => {
    const response = await api.post('/api/staff', staffData);
    return response.data;
  },
};

// Tasks API (for future use)
export const tasksAPI = {
  getByTicket: async (ticketId) => {
    const response = await api.get(`/api/tasks/${ticketId}`);
    return response.data;
  },

  create: async (taskData) => {
    const response = await api.post('/api/tasks', taskData);
    return response.data;
  },

  update: async (taskId, taskData) => {
    const response = await api.put(`/api/tasks/${taskId}`, taskData);
    return response.data;
  },
};

export default api;