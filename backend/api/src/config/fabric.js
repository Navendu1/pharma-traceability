// ==============================================================================
// HYPERLEDGER FABRIC GATEWAY CONFIGURATION
// File: backend/api/src/config/fabric.js
// ==============================================================================

const path = require('path');
const fs = require('fs');
const config = require('./environment');
const logger = require('../utils/logger');

const profilesDir = path.resolve(__dirname, '../../../../blockchain/gateway/connection-profiles');

/**
 * Load Connection Profile for a given MSP
 * @param {string} mspId - 'ManufacturerMSP' | 'DistributorMSP'
 */
function getConnectionProfile(mspId) {
    let filename = 'connection-org1-manufacturer.json';
    if (mspId === 'DistributorMSP') {
        filename = 'connection-org2-distributor.json';
    }

    const profilePath = path.join(profilesDir, filename);
    if (!fs.existsSync(profilePath)) {
        logger.warn(`Connection profile not found at ${profilePath}, using default settings`);
        return null;
    }

    return JSON.parse(fs.readFileSync(profilePath, 'utf8'));
}

/**
 * Get endpoint and TLS options for peer connection
 */
function getPeerEndpoint(mspId) {
    if (mspId === 'DistributorMSP') {
        return {
            endpoint: config.fabric.peerEndpointOrg2,
            serverName: 'peer0.org2.example.com',
            mspId: 'DistributorMSP'
        };
    }
    // Default: ManufacturerMSP (Org1)
    return {
        endpoint: config.fabric.peerEndpointOrg1,
        serverName: 'peer0.org1.example.com',
        mspId: 'ManufacturerMSP'
    };
}

module.exports = {
    getConnectionProfile,
    getPeerEndpoint,
    channelName: config.fabric.channelName,
    chaincodeName: config.fabric.chaincodeName
};

