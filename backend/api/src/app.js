// ==============================================================================
// EXPRESS APPLICATION CONFIGURATION
// File: backend/api/src/app.js
// ==============================================================================

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const config = require('./config/environment');
const db = require('./config/database');
const logger = require('./utils/logger');
const { apiLimiter } = require('./middleware/rateLimiter.middleware');
const { errorHandler, notFoundHandler } = require('./middleware/error.middleware');

// Route Imports
const authRoutes = require('./routes/auth.routes');
const productRoutes = require('./routes/product.routes');
const shipmentRoutes = require('./routes/shipment.routes');
const verificationRoutes = require('./routes/verification.routes');
const recallRoutes = require('./routes/recall.routes');

const app = express();

// 1. Perimeter Security Headers (Helmet)
app.use(helmet());

// 2. CORS Policy
app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, Postman)
        if (!origin) return callback(null, true);
        if (config.corsOrigin.includes(origin) || config.env === 'development') {
            return callback(null, true);
        }
        return callback(new Error('Cross-Origin Request Blocked by Security Policy'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// 3. Body Parsing Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 4. Request Logging Middleware
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        logger.info(`${req.method} ${req.originalUrl} [${res.statusCode}] - ${duration}ms`);
    });
    next();
});

// 5. Global API Rate Limiter
app.use(config.apiPrefix, apiLimiter);

// 6. Base Health Check Route
app.get('/health', async (req, res) => {
    const dbHealth = await db.healthCheck();
    res.status(200).json({
        success: true,
        service: 'Pharma Traceability Backend API',
        timestamp: new Date().toISOString(),
        environment: config.env,
        database: dbHealth
    });
});

// 7. Mount API Routes
app.use(`${config.apiPrefix}/auth`, authRoutes);
app.use(`${config.apiPrefix}/products`, productRoutes);
app.use(`${config.apiPrefix}/shipments`, shipmentRoutes);
app.use(`${config.apiPrefix}/verification`, verificationRoutes);
app.use(`${config.apiPrefix}/recalls`, recallRoutes);

// 8. 404 & Centralized Error Handlers
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;

