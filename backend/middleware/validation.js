// Validate phone number (Indian format: 10 digits, starts with 6-9)
const validatePhone = (phone) => {
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(phone);
};

// Validate email
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Sanitize string (prevent XSS)
const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;
  
  return str
    .trim()
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

// Validate message input
const validateMessage = (req, res, next) => {
  const { message } = req.body;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Message is required and must be a string'
    });
  }

  if (message.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Message cannot be empty'
    });
  }

  if (message.length > 5000) {
    return res.status(400).json({
      success: false,
      error: 'Message too long (max 5000 characters)'
    });
  }

  // Sanitize message
  req.body.message = sanitizeString(message);

  next();
};

// Validate ticket status
const validateTicketStatus = (req, res, next) => {
  const { status } = req.body;

  const validStatuses = ['open', 'pending_reply', 'no_reply', 'closed'];

  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
    });
  }

  next();
};

// Validate task creation
const validateTask = (req, res, next) => {
  const { ticketId, title } = req.body;

  if (!ticketId) {
    return res.status(400).json({
      success: false,
      error: 'Ticket ID is required'
    });
  }

  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Task title is required'
    });
  }

  if (title.length > 255) {
    return res.status(400).json({
      success: false,
      error: 'Task title too long (max 255 characters)'
    });
  }

  // Sanitize
  req.body.title = sanitizeString(title);
  if (req.body.description) {
    req.body.description = sanitizeString(req.body.description);
  }

  next();
};

// Validate staff registration
const validateStaffRegistration = (req, res, next) => {
  const { name, email, phone, password } = req.body;

  // Check required fields
  if (!name || !email || !phone || !password) {
    return res.status(400).json({
      success: false,
      error: 'All fields (name, email, phone, password) are required'
    });
  }

  // Validate name
  if (name.length < 2 || name.length > 100) {
    return res.status(400).json({
      success: false,
      error: 'Name must be between 2 and 100 characters'
    });
  }

  // Validate email
  if (!validateEmail(email)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid email address'
    });
  }

  // Validate phone
  if (!validatePhone(phone)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid phone number. Must be 10 digits starting with 6-9'
    });
  }

  // Validate password
  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      error: 'Password must be at least 6 characters'
    });
  }

  if (password.length > 100) {
    return res.status(400).json({
      success: false,
      error: 'Password too long (max 100 characters)'
    });
  }

  // Sanitize inputs
  req.body.name = sanitizeString(name);
  req.body.email = email.toLowerCase().trim();
  req.body.phone = phone.trim();

  next();
};

// Validate staff login
const validateLogin = (req, res, next) => {
  const { phone, password } = req.body;

  if (!phone || !password) {
    return res.status(400).json({
      success: false,
      error: 'Phone and password are required'
    });
  }

  if (!validatePhone(phone)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid phone number format'
    });
  }

  req.body.phone = phone.trim();

  next();
};

// Validate ticket assignment
const validateAssignment = (req, res, next) => {
  const { ticketId, staffId } = req.body;

  if (!ticketId || !staffId) {
    return res.status(400).json({
      success: false,
      error: 'Ticket ID and Staff ID are required'
    });
  }

  if (isNaN(ticketId) || isNaN(staffId)) {
    return res.status(400).json({
      success: false,
      error: 'Ticket ID and Staff ID must be numbers'
    });
  }

  next();
};

module.exports = {
  validatePhone,
  validateEmail,
  sanitizeString,
  validateMessage,
  validateTicketStatus,
  validateTask,
  validateStaffRegistration,
  validateLogin,
  validateAssignment
};