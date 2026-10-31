// ==============================================================================
// VERIFICATION & ANOMALY ENGINE SERVICE
// File: backend/api/src/services/verification.service.js
// ==============================================================================

const db = require('../config/database');
const blockchainService = require('./blockchain.service');
const anomalyService = require('./anomaly.service');
const { inMemorySerials } = require('./serial.service');
const logger = require('../utils/logger');

class VerificationService {
    /**
     * Public consumer verification check with advanced anomaly and velocity analysis
     * 
     * @param {string} serialNumber Packaging serial code
     * @param {object} metadata Contextual metadata { ip, userAgent, city, coordinates, latitude, longitude }
     */
    async verifySerial(serialNumber, metadata = {}) {
        logger.info(`Processing verification request for serial: ${serialNumber}`);

        // 1. Query Blockchain State (Evaluate Transaction)
        let fabricVerification = null;
        try {
            fabricVerification = await blockchainService.evaluateTransaction(
                'ManufacturerMSP',
                'VerifyProduct',
                serialNumber
            );
        } catch (e) {
            fabricVerification = { exists: false, verificationStatus: 'UNKNOWN_SERIAL' };
        }

        // 2. Query Local Database for enrichment & unit records
        let dbUnit = null;
        try {
            const res = await db.query(`
                SELECT s.*, b.batch_number, b.manufacturing_date, b.expiry_date, b.is_recalled,
                       p.brand_name, p.generic_name, p.dosage_form, p.strength,
                       o.name AS custodian_name
                FROM serial_units s
                JOIN batches b ON s.batch_id = b.id
                JOIN products p ON b.product_id = p.id
                JOIN organizations o ON s.current_custodian_id = o.id
                WHERE s.serial_number = $1;
            `, [serialNumber]);

            if (res.rows.length > 0) {
                dbUnit = res.rows[0];
            }
        } catch (e) {
            dbUnit = inMemorySerials.get(serialNumber);
        }

        if (!dbUnit && inMemorySerials.has(serialNumber)) {
            dbUnit = inMemorySerials.get(serialNumber);
        }

        // 3. Multi-Vector Anomaly & Velocity Analysis
        const assessment = await anomalyService.analyzeScan(serialNumber, metadata, fabricVerification, dbUnit);

        // 4. Record Scan Event & Update Metrics
        await anomalyService.recordScan(serialNumber, metadata, assessment);

        return {
            serialNumber,
            verificationStatus: assessment.verificationStatus,
            alertMessage: assessment.alertMessage,
            blockchainVerified: !!(fabricVerification && fabricVerification.exists),
            anomaly: {
                isAnomaly: assessment.isAnomaly,
                anomalyType: assessment.anomalyType,
                riskScore: assessment.riskScore,
                scanCount: assessment.scanCount,
                velocityDetails: assessment.velocityDetails
            },
            details: (fabricVerification && fabricVerification.exists) ? {
                product: fabricVerification.product,
                batch: fabricVerification.batch,
                currentCustodian: fabricVerification.currentCustodian,
                status: fabricVerification.status,
                soldAt: fabricVerification.soldAt
            } : null
        };
    }

    /**
     * Retrieve complete verifiable journey history from blockchain
     */
    async getProductHistory(serialNumber) {
        try {
            const rawHistory = await blockchainService.evaluateTransaction(
                'ManufacturerMSP',
                'GetProductHistory',
                serialNumber
            );
            return rawHistory;
        } catch (e) {
            logger.warn(`Failed to fetch history for ${serialNumber}: ${e.message}`);
            return [];
        }
    }
}

module.exports = new VerificationService();
