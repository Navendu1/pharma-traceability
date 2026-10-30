// ==============================================================================
// CENTRALIZED ERROR HANDLING MIDDLEWARE
// File: backend/api/src/middleware/error.middleware.js
// ==============================================================================

const logger = require('../utils/logger');
const config = require('../config/environment');

const errorHandler = (err, req, res, next) => {
    logger.error(`[HTTP Error] ${req.method} ${req.url} - ${err.message}`, err);

    const statusCode = err.statusCode || (res.statusCode !== 200 ? res.statusCode : 500);

    const errorResponse = {
        success: false,
        error: {
            code: err.code || 'INTERNAL_SERVER_ERROR',
            message: err.message || 'An unexpected internal server error occurred.'
        }
    };

    // Include stack trace only in development
    if (config.env === 'development' && statusCode === 500) {
        errorResponse.error.stack = err.stack;
    }

    res.status(statusCode).json(errorResponse);
};

const notFoundHandler = (req, res, next) => {
    res.status(404).json({
        success: false,
        error: {
            code: 'NOT_FOUND',
            message: `Resource not found on path ${req.originalUrl}`
        }
    });
};

module.exports = {
    errorHandler,
    notFoundHandler
};

