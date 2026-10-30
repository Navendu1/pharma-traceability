// ==============================================================================
// AUTHENTICATION ROUTES
// File: backend/api/src/routes/auth.routes.js
// ==============================================================================

const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { validate } = require('../middleware/validation.middleware');
const { loginSchema } = require('../validators/auth.validator');
const { authenticate } = require('../middleware/auth.middleware');
const { authLimiter } = require('../middleware/rateLimiter.middleware');

// Public route: User login (rate-limited)
router.post('/login', authLimiter, validate(loginSchema), authController.login);

// Protected route: Get authenticated profile
router.get('/me', authenticate, authController.getMe);

module.exports = router;

