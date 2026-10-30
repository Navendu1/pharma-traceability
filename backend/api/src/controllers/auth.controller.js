// ==============================================================================
// AUTHENTICATION CONTROLLER
// File: backend/api/src/controllers/auth.controller.js
// ==============================================================================

const authService = require('../services/auth.service');
const logger = require('../utils/logger');

class AuthController {
    /**
     * @route POST /api/v1/auth/login
     * @desc Authenticate user and receive access token
     */
    async login(req, res, next) {
        try {
            const { email, password } = req.body;
            const result = await authService.login(email, password);

            logger.info(`Successful login for user: ${email} (${result.organization.name})`);

            res.status(200).json({
                success: true,
                message: 'Authentication successful',
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * @route GET /api/v1/auth/me
     * @desc Get current authenticated user profile
     */
    async getMe(req, res, next) {
        try {
            const profile = await authService.getUserProfile(req.user.id);
            res.status(200).json({
                success: true,
                data: profile
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new AuthController();

