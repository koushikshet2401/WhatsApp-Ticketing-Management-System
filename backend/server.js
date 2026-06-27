const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config();

// Error handling for uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  // In production, we might want to let PM2 restart the app
  if (process.env.NODE_ENV === 'production') process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
  if (process.env.NODE_ENV === 'production') process.exit(1);
});

// Import middleware
const { authMiddleware } = require('./middleware/auth');

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
const whatsappConfigRoutes = require('./routes/whatsappConfigRoutes');
const testRoutes = require('./routes/test');

// Import database to test connection
require('./config/database');

const app = express();
const PORT = process.env.PORT || 5000;

// Security and middleware
app.use(helmet());
app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      'http://localhost:5173',
      'http://localhost:3000'
    ];
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      return callback(null, false); // For simplicity, we just won't block it strictly in dev, but ideally throw error. Let's just return true for dev flexibility.
    }
    return callback(null, true);
  },
  credentials: true
}));
app.use(bodyParser.json({
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(bodyParser.urlencoded({ extended: true }));


// Request logging middleware (development only)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'running',
    message: 'WhatsApp Ticketing System API',
    version: '1.0.0',
    appMode: process.env.APP_MODE || 'production',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      tickets: '/api/tickets',
      messages: '/api/messages',
      staff: '/api/staff',
      tasks: '/api/tasks',
      test: '/api/test',
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

// Public API Routes
app.use('/webhook', webhookRoutes);          // WhatsApp webhook
app.use('/api/auth', authRoutes);            // Authentication (login, register)
app.use('/api/test', testRoutes);            // Test routes

// Protected API Routes (require JWT token)
app.use('/api/tickets', authMiddleware, ticketRoutes);       // Ticket management
app.use('/api/messages', authMiddleware, messageRoutes);     // Message management
app.use('/api/staff', authMiddleware, staffRoutes);          // Staff management
app.use('/api/tasks', authMiddleware, taskRoutes);           // Task management
app.use('/api/analytics', authMiddleware, analyticsRoutes);
app.use('/api/phones', authMiddleware, phoneRoutes);
app.use('/api/templates', authMiddleware, templateRoutes);
app.use('/api/contacts', authMiddleware, contactRoutes);
app.use('/api/bulk-messages', authMiddleware, bulkMessageRoutes);
app.use('/api/knowledge-base', authMiddleware, kbRoutes);
app.use('/api/whatsapp-config', whatsappConfigRoutes);

// Serve static React files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'public')));
}

// ==================== ERROR HANDLERS ====================

// API 404 handler - Must be AFTER all API routes
const apiNotFoundHandler = (req, res) => {
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
      test: '/api/test/*',
      webhook: '/webhook'
    }
  });
};

app.use('/api', apiNotFoundHandler);
app.use('/webhook', apiNotFoundHandler);

// React catch-all route (Must be after API routes but before global error handler)
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/index.html'));
  });
}

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