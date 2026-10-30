// ==============================================================================
// HTTP SERVER ENTRYPOINT
// File: backend/api/src/server.js
// ==============================================================================

const app = require('./app');
const config = require('./config/environment');
const db = require('./config/database');
const logger = require('./utils/logger');

const server = app.listen(config.port, config.host, () => {
    logger.info('====================================================');
    logger.info(`🚀 Pharma Traceability API Server Started`);
    logger.info(`📡 URL     : http://${config.host}:${config.port}`);
    logger.info(`📍 Health  : http://${config.host}:${config.port}/health`);
    logger.info(`🔐 Auth    : http://${config.host}:${config.port}${config.apiPrefix}/auth/login`);
    logger.info(`🌍 Env     : ${config.env}`);
    logger.info('====================================================');
});

// Graceful Shutdown Handling
const gracefulShutdown = async (signal) => {
    logger.info(`[${signal}] Initiating graceful shutdown...`);

    server.close(async () => {
        logger.info('HTTP server closed.');
        try {
            await db.close();
            logger.info('Database pool drained.');
            process.exit(0);
        } catch (err) {
            logger.error('Error during database pool shutdown:', err);
            process.exit(1);
        }
    });

    // Force close after 10 seconds if hanging
    setTimeout(() => {
        logger.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
    }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

module.exports = server;

