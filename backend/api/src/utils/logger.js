// ==============================================================================
// APPLICATION LOGGER
// File: backend/api/src/utils/logger.js
// ==============================================================================

const config = require('../config/environment');

const formatTime = () => new Date().toISOString();

const logger = {
    info: (message, meta = {}) => {
        console.log(`[${formatTime()}] [INFO]  ${message}`, Object.keys(meta).length ? JSON.stringify(meta) : '');
    },
    warn: (message, meta = {}) => {
        console.warn(`[${formatTime()}] [WARN]  ${message}`, Object.keys(meta).length ? JSON.stringify(meta) : '');
    },
    error: (message, error = {}) => {
        console.error(`[${formatTime()}] [ERROR] ${message}`, error.stack || error.message || error);
    },
    debug: (message, meta = {}) => {
        if (config.env === 'development') {
            console.log(`[${formatTime()}] [DEBUG] ${message}`, Object.keys(meta).length ? JSON.stringify(meta) : '');
        }
    }
};

module.exports = logger;
