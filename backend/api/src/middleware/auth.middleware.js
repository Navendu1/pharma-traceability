// ==============================================================================
// JWT AUTHENTICATION MIDDLEWARE
// File: backend/api/src/middleware/auth.middleware.js
// ==============================================================================

const jwt = require('jsonwebtoken');
const config = require('../config/environment');

const authenticate = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'Authentication token missing or invalid format. Header format: Bearer <token>'
                }
            });
        }

        const token = authHeader.split(' ')[1];

        jwt.verify(token, config.jwt.secret, (err, decoded) => {
            if (err) {
                const message = err.name === 'TokenExpiredError' 
                    ? 'Authentication token has expired. Please log in again.' 
                    : 'Invalid authentication token signature.';

                return res.status(401).json({
                    success: false,
                    error: {
                        code: 'INVALID_TOKEN',
                        message
                    }
                });
            }

            // Attach user session payload
            req.user = {
                id: decoded.userId,
                organizationId: decoded.orgId,
                email: decoded.email,
                role: decoded.role,
                mspId: decoded.mspId,
                orgType: decoded.orgType
            };

            next();
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: {
                code: 'AUTH_PROCESSING_ERROR',
                message: 'Failed to process authorization token.'
            }
        });
    }
};

module.exports = { authenticate };
