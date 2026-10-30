// ==============================================================================
// CRYPTOGRAPHIC UTILITIES
// File: backend/api/src/utils/cryptoUtils.js
// ==============================================================================

const argon2 = require('argon2');
const crypto = require('crypto');
const config = require('../config/environment');

/**
 * Hash a plaintext password using Argon2id with calibrated parameters
 * @param {string} password - Raw plaintext password
 * @returns {Promise<string>} Encoded Argon2id hash string
 */
async function hashPassword(password) {
    return await argon2.hash(password, {
        type: argon2.argon2id,
        memoryCost: config.argon2.memoryCost,
        timeCost: config.argon2.timeCost,
        parallelism: config.argon2.parallelism
    });
}

/**
 * Verify a plaintext password against an existing Argon2 hash
 * @param {string} hash - Stored Argon2 hash
 * @param {string} password - Plaintext password candidate
 * @returns {Promise<boolean>} True if match, false otherwise
 */
async function verifyPassword(hash, password) {
    try {
        return await argon2.verify(hash, password);
    } catch (error) {
        return false;
    }
}

/**
 * Compute canonical SHA-256 hash of any JavaScript object or string
 * Keys are sorted recursively to guarantee deterministic hash output
 * @param {object|string} data - Payload to hash
 * @returns {string} 64-character lowercase hex digest
 */
function computeCanonicalHash(data) {
    let canonicalString = '';
    if (typeof data === 'string') {
        canonicalString = data;
    } else {
        const sortObject = (obj) => {
            if (obj === null || typeof obj !== 'object') return obj;
            if (Array.isArray(obj)) return obj.map(sortObject);
            return Object.keys(obj)
                .sort()
                .reduce((result, key) => {
                    result[key] = sortObject(obj[key]);
                    return result;
                }, {});
        };
        canonicalString = JSON.stringify(sortObject(data));
    }
    return crypto.createHash('sha256').update(canonicalString).digest('hex');
}

/**
 * Generate a cryptographically secure random serial identifier
 * Format: MED-IN-XXXX-XXXX-XXXX
 * @returns {string} Unique pharmaceutical serial token
 */
function generateSecureSerial() {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // Base32 without confusing chars (0/O, 1/I)
    const segment = (len) => {
        const bytes = crypto.randomBytes(len);
        let str = '';
        for (let i = 0; i < len; i++) {
            str += chars[bytes[i] % chars.length];
        }
        return str;
    };
    return `MED-IN-${segment(4)}-${segment(4)}-${segment(4)}`;
}

module.exports = {
    hashPassword,
    verifyPassword,
    computeCanonicalHash,
    generateSecureSerial
};
