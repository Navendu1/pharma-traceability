// ==============================================================================
// AUTHENTICATION SERVICE
// File: backend/api/src/services/auth.service.js
// ==============================================================================

const jwt = require('jsonwebtoken');
const db = require('../config/database');
const config = require('../config/environment');
const { verifyPassword } = require('../utils/cryptoUtils');

// Fallback seed store if PostgreSQL container is offline
const fallbackUsers = [
    {
        id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        organization_id: '11111111-1111-1111-1111-111111111111',
        username: 'mfg_admin',
        email: 'mfg_admin@apexbiopharma.com',
        password_hash: '$argon2id$v=19$m=65536,t=3,p=4$mYBuaBSKB8q6vviQkYuVkg$mkeh2UeEHxCOeGcnozueCU5xuDfhwD6B4Fu4ADZoOpA',
        full_name: 'Dr. Subhash Sen (Quality Head)',
        role: 'ORG_ADMIN',
        is_active: true,
        org_name: 'Apex Biopharma Ltd.',
        org_type: 'MANUFACTURER',
        org_msp_id: 'ManufacturerMSP',
        org_license: 'DL-WB-2024-MFG-0019',
        org_verified: true
    },
    {
        id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        organization_id: '22222222-2222-2222-2222-222222222222',
        username: 'dist_admin',
        email: 'dist_admin@easternmed.com',
        password_hash: '$argon2id$v=19$m=65536,t=3,p=4$mYBuaBSKB8q6vviQkYuVkg$mkeh2UeEHxCOeGcnozueCU5xuDfhwD6B4Fu4ADZoOpA',
        full_name: 'Vikramaditya Patnaik (Logistics Lead)',
        role: 'ORG_ADMIN',
        is_active: true,
        org_name: 'Eastern MedLogistics Pvt Ltd.',
        org_type: 'DISTRIBUTOR',
        org_msp_id: 'DistributorMSP',
        org_license: 'DL-OD-2024-DST-0042',
        org_verified: true
    },
    {
        id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
        organization_id: '44444444-4444-4444-4444-444444444444',
        username: 'pharm_admin',
        email: 'pharm_admin@medpluscare.com',
        password_hash: '$argon2id$v=19$m=65536,t=3,p=4$mYBuaBSKB8q6vviQkYuVkg$mkeh2UeEHxCOeGcnozueCU5xuDfhwD6B4Fu4ADZoOpA',
        full_name: 'Ananya Roy, Registered Pharmacist',
        role: 'ORG_ADMIN',
        is_active: true,
        org_name: 'MedPlus Care Pharmacy',
        org_type: 'PHARMACY',
        org_msp_id: 'PharmacyMSP',
        org_license: 'DL-WB-2024-RET-0912',
        org_verified: true
    }
];

class AuthService {
    /**
     * Authenticate user with email and password
     */
    async login(email, password) {
        let userRecord = null;

        try {
            // Attempt query against live PostgreSQL pool
            const result = await db.query(`
                SELECT 
                    u.id, u.organization_id, u.username, u.email, u.password_hash, 
                    u.full_name, u.role, u.is_active,
                    o.name AS org_name, o.type AS org_type, o.msp_id AS org_msp_id,
                    o.license_number AS org_license, o.is_verified AS org_verified
                FROM users u
                JOIN organizations o ON u.organization_id = o.id
                WHERE LOWER(u.email) = LOWER($1);
            `, [email]);

            if (result.rows.length > 0) {
                userRecord = result.rows[0];
            }
        } catch (dbError) {
            // Fallback to verified seed data if database is currently starting or unreachable
            userRecord = fallbackUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
        }

        if (!userRecord) {
            const err = new Error('Invalid email or password');
            err.statusCode = 401;
            err.code = 'INVALID_CREDENTIALS';
            throw err;
        }

        if (!userRecord.is_active) {
            const err = new Error('User account has been deactivated. Please contact your organization administrator.');
            err.statusCode = 403;
            err.code = 'ACCOUNT_DEACTIVATED';
            throw err;
        }

        // Verify password with Argon2id
        const isMatch = await verifyPassword(userRecord.password_hash, password);
        if (!isMatch) {
            const err = new Error('Invalid email or password');
            err.statusCode = 401;
            err.code = 'INVALID_CREDENTIALS';
            throw err;
        }

        // Generate Access Token (JWT)
        const payload = {
            userId: userRecord.id,
            orgId: userRecord.organization_id,
            email: userRecord.email,
            role: userRecord.role,
            mspId: userRecord.org_msp_id,
            orgType: userRecord.org_type
        };

        const accessToken = jwt.sign(payload, config.jwt.secret, {
            expiresIn: config.jwt.expiresIn
        });

        const refreshToken = jwt.sign({ userId: userRecord.id }, config.jwt.refreshSecret, {
            expiresIn: config.jwt.refreshExpiresIn
        });

        return {
            user: {
                id: userRecord.id,
                username: userRecord.username,
                email: userRecord.email,
                fullName: userRecord.full_name,
                role: userRecord.role
            },
            organization: {
                id: userRecord.organization_id,
                name: userRecord.org_name,
                type: userRecord.org_type,
                mspId: userRecord.org_msp_id,
                licenseNumber: userRecord.org_license,
                isVerified: userRecord.org_verified
            },
            tokens: {
                accessToken,
                refreshToken,
                expiresIn: config.jwt.expiresIn
            }
        };
    }

    /**
     * Get user profile by ID
     */
    async getUserProfile(userId) {
        let user = null;

        try {
            const result = await db.query(`
                SELECT 
                    u.id, u.organization_id, u.username, u.email, 
                    u.full_name, u.role, u.is_active, u.created_at,
                    o.name AS org_name, o.type AS org_type, o.msp_id AS org_msp_id,
                    o.license_number AS org_license, o.is_verified AS org_verified
                FROM users u
                JOIN organizations o ON u.organization_id = o.id
                WHERE u.id = $1;
            `, [userId]);

            if (result.rows.length > 0) {
                user = result.rows[0];
            }
        } catch (dbError) {
            user = fallbackUsers.find(u => u.id === userId);
        }

        if (!user) {
            const err = new Error('User profile not found');
            err.statusCode = 404;
            err.code = 'USER_NOT_FOUND';
            throw err;
        }

        return {
            id: user.id,
            username: user.username,
            email: user.email,
            fullName: user.full_name,
            role: user.role,
            organization: {
                id: user.organization_id,
                name: user.org_name,
                type: user.org_type,
                mspId: user.org_msp_id,
                licenseNumber: user.org_license,
                isVerified: user.org_verified
            }
        };
    }
}

module.exports = new AuthService();
