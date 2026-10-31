// ==============================================================================
// BATCH RECALL MANAGEMENT SERVICE
// File: backend/api/src/services/recall.service.js
// ==============================================================================

const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const blockchainService = require('./blockchain.service');
const logger = require('../utils/logger');

const inMemoryRecalls = [];

class RecallService {
    /**
     * Trigger a batch recall
     */
    async initiateRecall(initiatorUser, { batchNumber, reason, severity }) {
        logger.warn(`Initiating ${severity} recall for batch ${batchNumber} by ${initiatorUser.mspId}`);
        const recallId = uuidv4();

        // 1. Submit Recall to Fabric Gateway
        const fabricResult = await blockchainService.submitTransaction(
            initiatorUser.mspId,
            'RecallBatch',
            batchNumber,
            reason,
            severity
        );

        // 2. Update Database & in-memory store
        try {
            await db.query(`
                UPDATE batches SET is_recalled = TRUE WHERE batch_number = $1;
                INSERT INTO recalls (id, batch_id, initiator_org_id, reason, severity, blockchain_status, blockchain_tx_id, status)
                VALUES ($1, (SELECT id FROM batches WHERE batch_number = $2 LIMIT 1), $3, $4, $5, 'COMMITTED', $6, 'ACTIVE');
            `, [recallId, batchNumber, initiatorUser.organizationId, reason, severity, fabricResult.txId]);
        } catch (e) {
            inMemoryRecalls.push({
                id: recallId,
                batchNumber,
                initiatorMspId: initiatorUser.mspId,
                reason,
                severity,
                blockchainTxId: fabricResult.txId,
                status: 'ACTIVE',
                createdAt: new Date().toISOString()
            });
        }

        return {
            id: recallId,
            batchNumber,
            severity,
            status: 'ACTIVE',
            blockchainTxId: fabricResult.txId
        };
    }

    /**
     * List all recalls
     */
    async getAllRecalls() {
        try {
            const res = await db.query(`
                SELECT r.*, b.batch_number, o.name AS initiator_name
                FROM recalls r
                JOIN batches b ON r.batch_id = b.id
                JOIN organizations o ON r.initiator_org_id = o.id
                ORDER BY r.recall_date DESC;
            `);
            if (res.rows.length > 0) return res.rows;
        } catch (e) {}

        return inMemoryRecalls;
    }
}

module.exports = new RecallService();
