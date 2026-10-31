// ==============================================================================
// VERIFICATION & ANOMALY ENGINE SERVICE
// File: backend/api/src/services/verification.service.js
// ==============================================================================

const db = require('../config/database');
const blockchainService = require('./blockchain.service');
const { inMemorySerials } = require('./serial.service');
const logger = require('../utils/logger');

class VerificationService {
    /**
     * Public consumer verification check
     */
    async verifySerial(serialNumber, metadata = {}) {
        logger.info(`Processing verification request for serial: ${serialNumber}`);

        // 1. Query Blockchain State (Evaluate)
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

        // 2. Query Local Database for enrichment & duplicate scan metrics
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

        // 3. Evaluate Status & Detect Anomaly
        let finalStatus = 'UNKNOWN_SERIAL';
        let alertMessage = 'This serial number is not found in the pharmaceutical ledger.';

        if (fabricVerification && fabricVerification.exists) {
            finalStatus = fabricVerification.verificationStatus;

            if (finalStatus === 'AUTHENTIC') {
                alertMessage = 'Genuine Product: Product authenticity and cryptographic signature verified on blockchain.';
            } else if (finalStatus === 'RECALLED') {
                alertMessage = '⚠️ CRITICAL RECALL ALERT: This batch has been officially recalled by the manufacturer/regulator. Do not dispense or consume!';
            } else if (finalStatus === 'EXPIRED') {
                alertMessage = '⚠️ EXPIRED PRODUCT: This medicine batch has passed its expiration date.';
            } else if (finalStatus === 'ALREADY_SOLD') {
                alertMessage = '🚨 SUSPICIOUS DUPLICATE SCAN: This serial number was previously recorded as sold. Potential counterfeit clone detected!';
            }
        }

        // 4. Log Scan to Verification Logs
        try {
            await db.query(`
                INSERT INTO verification_logs (scanned_serial_raw, scanner_ip, location_city, verification_result)
                VALUES ($1, $2, $3, $4);
            `, [serialNumber, metadata.ip || '127.0.0.1', metadata.city || 'Kolkata', finalStatus]);
        } catch (e) {}

        return {
            serialNumber,
            verificationStatus: finalStatus,
            alertMessage,
            blockchainVerified: fabricVerification.exists,
            details: fabricVerification.exists ? {
                product: fabricVerification.product,
                batch: fabricVerification.batch,
                currentCustodian: fabricVerification.currentCustodian,
                status: fabricVerification.status,
                soldAt: fabricVerification.soldAt
            } : null
        };
    }

    /**
     * Retrieve complete verifiable journey history
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
            return [];
        }
    }
}

module.exports = new VerificationService();

