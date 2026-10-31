// ==============================================================================
// SERIAL GENERATION & UNIT SERVICE
// File: backend/api/src/services/serial.service.js
// ==============================================================================

const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const blockchainService = require('./blockchain.service');
const { generateSecureSerial, computeCanonicalHash } = require('../utils/cryptoUtils');
const logger = require('../utils/logger');

const inMemorySerials = new Map();

class SerialService {
    /**
     * Generate N unique serial identifiers for a batch and commit to Fabric
     */
    async generateSerials(manufacturerUser, { batchNumber, count }) {
        logger.info(`Generating ${count} serial units for batch ${batchNumber}`);
        const generatedUnits = [];

        for (let i = 0; i < count; i++) {
            const serialNumber = generateSecureSerial();
            const unitId = uuidv4();
            const digitalSignature = computeCanonicalHash({
                serialNumber,
                batchNumber,
                issuer: manufacturerUser.mspId,
                timestamp: Date.now()
            });

            // Commit serial to Blockchain
            const txResult = await blockchainService.submitTransaction(
                manufacturerUser.mspId,
                'CreateSerial',
                serialNumber,
                batchNumber,
                digitalSignature
            );

            // Save serial to Database
            try {
                await db.query(`
                    INSERT INTO serial_units (id, batch_id, serial_number, current_custodian_id, status, cryptographic_signature)
                    VALUES ($1, (SELECT id FROM batches WHERE batch_number = $2 LIMIT 1), $3, $4, 'CREATED', $5);
                `, [unitId, batchNumber, serialNumber, manufacturerUser.organizationId, digitalSignature]);
            } catch (e) {
                inMemorySerials.set(serialNumber, {
                    id: unitId,
                    batchNumber,
                    serialNumber,
                    currentCustodianId: manufacturerUser.organizationId,
                    currentCustodianMsp: manufacturerUser.mspId,
                    status: 'CREATED',
                    cryptographicSignature: digitalSignature,
                    blockchainTxId: txResult.txId,
                    verificationCount: 0,
                    createdAt: new Date().toISOString()
                });
            }

            generatedUnits.push({
                id: unitId,
                serialNumber,
                batchNumber,
                status: 'CREATED',
                blockchainTxId: txResult.txId
            });
        }

        return {
            batchNumber,
            totalGenerated: generatedUnits.length,
            serials: generatedUnits
        };
    }

    /**
     * Get single serial unit details
     */
    async getSerial(serialNumber) {
        try {
            const res = await db.query(`
                SELECT s.*, b.batch_number, b.expiry_date, b.is_recalled, o.name AS custodian_name
                FROM serial_units s
                JOIN batches b ON s.batch_id = b.id
                JOIN organizations o ON s.current_custodian_id = o.id
                WHERE s.serial_number = $1;
            `, [serialNumber]);
            if (res.rows.length > 0) return res.rows[0];
        } catch (e) {}

        return inMemorySerials.get(serialNumber) || null;
    }
}

module.exports = {
    serialService: new SerialService(),
    inMemorySerials
};

