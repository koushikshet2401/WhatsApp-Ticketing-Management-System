const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const { authMiddleware } = require('../middleware/auth');
const { validateStaffRegistration, validateLogin } = require('../middleware/validation');

// POST /api/auth/register - Register new staff
router.post('/register', validateStaffRegistration, AuthController.register);

// POST /api/auth/login - Login
router.post('/login', validateLogin, AuthController.login);

// GET /api/auth/me - Get current user (protected)
router.get('/me', authMiddleware, AuthController.getCurrentUser);

// POST /api/auth/change-password - Change password (protected)
router.post('/change-password', authMiddleware, AuthController.changePassword);

module.exports = router;