// ==============================================================================
// ENVIRONMENT CONFIGURATION LOADER
// File: backend/api/src/config/environment.js
// ==============================================================================

const path = require('path');
const dotenv = require('dotenv');

// Load .env file from backend/api or root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const config = {
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '5000', 10),
    host: process.env.HOST || '0.0.0.0',
    apiPrefix: process.env.API_PREFIX || '/api/v1',
    corsOrigin: (process.env.CORS_ORIGIN || 'http://localhost:5173').split(','),

    // Database
    db: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        database: process.env.DB_NAME || 'pharma_traceability_db',
        user: process.env.DB_USER || 'pharma_admin',
        password: process.env.DB_PASSWORD || 'pharma_secure_password_123',
        min: parseInt(process.env.DB_POOL_MIN || '2', 10),
        max: parseInt(process.env.DB_POOL_MAX || '20', 10),
        ssl: process.env.DB_SSL === 'true'
    },

    // Security & Auth
    jwt: {
        secret: process.env.JWT_SECRET || 'dev_jwt_secret_change_in_production_min_32_chars',
        expiresIn: process.env.JWT_EXPIRES_IN || '1h',
        refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev_jwt_refresh_secret_min_32_chars',
        refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
    },
    argon2: {
        memoryCost: parseInt(process.env.ARGON2_MEMORY_COST || '65536', 10),
        timeCost: parseInt(process.env.ARGON2_TIME_COST || '3', 10),
        parallelism: parseInt(process.env.ARGON2_PARALLELISM || '4', 10)
    },

    // Blockchain / Fabric
    fabric: {
        channelName: process.env.FABRIC_CHANNEL_NAME || 'pharmachannel',
        chaincodeName: process.env.FABRIC_CHAINCODE_NAME || 'pharma-contract',
        mspIdOrg1: process.env.FABRIC_MSP_ID_ORG1 || 'ManufacturerMSP',
        mspIdOrg2: process.env.FABRIC_MSP_ID_ORG2 || 'DistributorMSP',
        peerEndpointOrg1: process.env.FABRIC_PEER_ENDPOINT_ORG1 || 'localhost:7051',
        peerEndpointOrg2: process.env.FABRIC_PEER_ENDPOINT_ORG2 || 'localhost:9051',
        asLocalhost: process.env.FABRIC_AS_LOCALHOST !== 'false'
    }
};

module.exports = config;

