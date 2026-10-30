// ==============================================================================
// RATE LIMITING MIDDLEWARE
// File: backend/api/src/middleware/rateLimiter.middleware.js
// ==============================================================================

const rateLimit = require('express-rate-limit');

// Strict rate limiter for authentication routes (login / refresh)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20,                   // 20 requests per IP per window
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        error: {
            code: 'TOO_MANY_REQUESTS',
            message: 'Too many authentication attempts. Please try again after 15 minutes.'
        }
    }
});

// General API rate limiter
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 300,                  // 300 requests per IP
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        error: {
            code: 'TOO_MANY_REQUESTS',
            message: 'Rate limit exceeded. Please throttle your requests.'
        }
    }
});

module.exports = {
    authLimiter,
    apiLimiter
};

