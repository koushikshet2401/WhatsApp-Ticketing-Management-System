const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

// Import routes
const webhookRoutes = require('./routes/webhook');
const authRoutes = require('./routes/auth');
const ticketRoutes = require('./routes/tickets');
const messageRoutes = require('./routes/messages');
const staffRoutes = require('./routes/staff');
const taskRoutes = require('./routes/tasks');
const analyticsRoutes = require('./routes/analytics');
const phoneRoutes = require('./routes/phones');
const templateRoutes = require('./routes/templates');
const contactRoutes = require('./routes/contacts');
const bulkMessageRoutes = require('./routes/bulkMessages');
const kbRoutes = require('./routes/knowledgeBase');
const testRoutes = require('./routes/test');  // ← ADD THIS LINE

// Import database to test connection
require('./config/database');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Request logging middleware (development only)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// ==================== ROUTES ====================

// Health check
app.get('/', (req, res) => {
  res.json({
    status: 'running',
    message: 'WhatsApp Ticketing System API',
    version: '1.0.0',
    endpoints: {
      health: '/',
      auth: '/api/auth',
      tickets: '/api/tickets',
      messages: '/api/messages',
      staff: '/api/staff',
      tasks: '/api/tasks',
      test: '/api/test',  // ← ADD THIS
      webhook: '/webhook'
    },
    documentation: {
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        me: 'GET /api/auth/me',
        changePassword: 'POST /api/auth/change-password'
      },
      tickets: {
        create: 'POST /api/tickets',
        getAll: 'GET /api/tickets',
        getOne: 'GET /api/tickets/:id',
        updateStatus: 'PUT /api/tickets/:id/status',
        assign: 'POST /api/tickets/assign',
        getStaff: 'GET /api/tickets/:id/staff'
      },
      messages: {
        get: 'GET /api/messages/:ticketId',
        reply: 'POST /api/messages/:ticketId/reply'
      },
      staff: {
        getAll: 'GET /api/staff',
        getOne: 'GET /api/staff/:id',
        create: 'POST /api/staff'
      },
      tasks: {
        create: 'POST /api/tasks',
        getByTicket: 'GET /api/tasks/ticket/:ticketId',
        getByStaff: 'GET /api/tasks/staff/:staffId',
        getPending: 'GET /api/tasks/pending',
        update: 'PUT /api/tasks/:id',
        updateStatus: 'PUT /api/tasks/:id/status',
        delete: 'DELETE /api/tasks/:id'
      },
      // ← ADD TEST ENDPOINTS DOCUMENTATION
      test: {
        health: 'GET /api/test/health',
        mode: 'GET /api/test/mode',
        connection: 'GET /api/test/whatsapp',
        sendMessage: 'POST /api/test/whatsapp/send',
        simulateIncoming: 'POST /api/test/whatsapp/simulate-incoming',
        bulkSend: 'POST /api/test/whatsapp/bulk'
      }
    }
  });
});

// API Routes
app.use('/webhook', webhookRoutes);          // WhatsApp webhook
app.use('/api/auth', authRoutes);            // Authentication (login, register)
app.use('/api/tickets', ticketRoutes);       // Ticket management
app.use('/api/messages', messageRoutes);     // Message management
app.use('/api/staff', staffRoutes);          // Staff management
app.use('/api/tasks', taskRoutes);           // Task management
app.use('/api/analytics', analyticsRoutes);
app.use('/api/phones', phoneRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/bulk-messages', bulkMessageRoutes);
app.use('/api/knowledge-base', kbRoutes);
app.use('/api/test', testRoutes);            // ← ADD THIS LINE - Test routes

// ==================== ERROR HANDLERS ====================

// 404 handler - Must be AFTER all routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    message: `Cannot ${req.method} ${req.path}`,
    availableEndpoints: {
      auth: '/api/auth/*',
      tickets: '/api/tickets/*',
      messages: '/api/messages/*',
      staff: '/api/staff/*',
      tasks: '/api/tasks/*',
      test: '/api/test/*',  // ← ADD THIS
      webhook: '/webhook'
    }
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// ==================== START SERVER ====================

app.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log('🚀 WhatsApp Ticketing System API');
  console.log('='.repeat(50));
  console.log(`📡 Server running on port ${PORT}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/`);
  console.log(`📱 Webhook URL: http://localhost:${PORT}/webhook`);
  console.log(`🔐 Auth API: http://localhost:${PORT}/api/auth`);
  console.log(`📋 Tickets API: http://localhost:${PORT}/api/tickets`);
  console.log(`💬 Messages API: http://localhost:${PORT}/api/messages`);
  console.log(`👥 Staff API: http://localhost:${PORT}/api/staff`);
  console.log(`✅ Tasks API: http://localhost:${PORT}/api/tasks`);
  console.log(`🧪 Test API: http://localhost:${PORT}/api/test`);  // ← ADD THIS
  console.log('='.repeat(50));
});

module.exports = app;