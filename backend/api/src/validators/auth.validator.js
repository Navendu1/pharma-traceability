// ==============================================================================
// AUTHENTICATION INPUT VALIDATORS
// File: backend/api/src/validators/auth.validator.js
// ==============================================================================

const { z } = require('zod');

const loginSchema = z.object({
    email: z
        .string({ required_error: 'Email address is required' })
        .email('Invalid email address format')
        .toLowerCase()
        .trim(),
    password: z
        .string({ required_error: 'Password is required' })
        .min(8, 'Password must be at least 8 characters long')
});

const refreshTokenSchema = z.object({
    refreshToken: z
        .string({ required_error: 'Refresh token is required' })
        .min(10, 'Invalid refresh token format')
});

const registerUserSchema = z.object({
    organizationId: z.string().uuid('Valid Organization UUID is required'),
    username: z.string().min(3).max(50).trim(),
    email: z.string().email().toLowerCase().trim(),
    password: z.string().min(8).regex(/[A-Z]/, 'Must contain uppercase letter').regex(/[0-9]/, 'Must contain number'),
    fullName: z.string().min(2).max(100).trim(),
    role: z.enum(['SYSTEM_ADMIN', 'ORG_ADMIN', 'OPERATOR', 'INSPECTOR', 'AUDITOR'])
});

module.exports = {
    loginSchema,
    refreshTokenSchema,
    registerUserSchema
};
