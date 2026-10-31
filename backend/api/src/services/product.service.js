// ==============================================================================
// PRODUCT & BATCH MANAGEMENT SERVICE
// File: backend/api/src/services/product.service.js
// ==============================================================================

const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const blockchainService = require('./blockchain.service');
const { computeCanonicalHash } = require('../utils/cryptoUtils');
const logger = require('../utils/logger');

// In-Memory store for fast local demonstration & fallback
const inMemoryProducts = new Map();
const inMemoryBatches = new Map();

class ProductService {
    /**
     * Register a new master pharmaceutical product
     */
    async registerProduct(manufacturerUser, productData) {
        const { gtin, brandName, genericName, dosageForm, strength, storageConditions, description } = productData;
        const productId = uuidv4();

        // Dual-Write Coordination
        const result = await blockchainService.executeCoordinatedTransaction({
            callerMspId: manufacturerUser.mspId,
            chaincodeFunction: 'RegisterProduct',
            chaincodeArgs: [gtin, brandName, genericName, dosageForm, strength],
            onPreDatabaseWrite: async () => {
                try {
                    await db.query(`
                        INSERT INTO products (id, manufacturer_id, gtin, brand_name, generic_name, dosage_form, strength, storage_conditions, description)
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);
                    `, [productId, manufacturerUser.organizationId, gtin, brandName, genericName, dosageForm, strength, storageConditions, description]);
                } catch (e) {
                    // Fallback to in-memory store if DB container offline
                    inMemoryProducts.set(gtin, {
                        id: productId,
                        manufacturerId: manufacturerUser.organizationId,
                        gtin,
                        brandName,
                        genericName,
                        dosageForm,
                        strength,
                        storageConditions,
                        description,
                        createdAt: new Date().toISOString()
                    });
                }
                return { productId, gtin };
            },
            onPostDatabaseSuccess: async (record, txId) => {
                logger.info(`Product registered successfully on DB and Fabric (TxID: ${txId})`);
            },
            onDatabaseFailure: async (record, error) => {
                logger.error(`Product registration aborted due to blockchain failure: ${error}`);
            }
        });

        return {
            id: productId,
            gtin,
            brandName,
            genericName,
            dosageForm,
            strength,
            blockchainTxId: result.txId,
            blockchainStatus: 'COMMITTED'
        };
    }

    /**
     * Register a production batch
     */
    async registerBatch(manufacturerUser, batchData) {
        const { gtin, batchNumber, manufacturingDate, expiryDate, quantity } = batchData;
        const batchId = uuidv4();

        // Calculate deterministic SHA-256 canonical proof hash
        const proofHash = computeCanonicalHash({
            gtin,
            batchNumber,
            manufacturingDate,
            expiryDate,
            quantity,
            manufacturerMspId: manufacturerUser.mspId
        });

        // Dual-write to DB and Blockchain
        const result = await blockchainService.executeCoordinatedTransaction({
            callerMspId: manufacturerUser.mspId,
            chaincodeFunction: 'RegisterBatch',
            chaincodeArgs: [batchNumber, gtin, manufacturingDate, expiryDate, quantity.toString(), proofHash],
            onPreDatabaseWrite: async () => {
                try {
                    await db.query(`
                        INSERT INTO batches (id, product_id, batch_number, manufacturing_date, expiry_date, quantity, remaining_quantity, blockchain_status, proof_hash)
                        VALUES ($1, (SELECT id FROM products WHERE gtin = $2 LIMIT 1), $3, $4, $5, $6, $6, 'PENDING', $7);
                    `, [batchId, gtin, batchNumber, manufacturingDate, expiryDate, quantity, proofHash]);
                } catch (e) {
                    inMemoryBatches.set(batchNumber, {
                        id: batchId,
                        gtin,
                        batchNumber,
                        manufacturingDate,
                        expiryDate,
                        quantity,
                        remainingQuantity: quantity,
                        proofHash,
                        blockchainStatus: 'PENDING',
                        isRecalled: false,
                        createdAt: new Date().toISOString()
                    });
                }
                return { batchId, batchNumber };
            },
            onPostDatabaseSuccess: async (record, txId) => {
                try {
                    await db.query(`
                        UPDATE batches SET blockchain_status = 'COMMITTED', blockchain_tx_id = $1 WHERE id = $2;
                    `, [txId, batchId]);
                } catch (e) {
                    const b = inMemoryBatches.get(batchNumber);
                    if (b) {
                        b.blockchainStatus = 'COMMITTED';
                        b.blockchainTxId = txId;
                    }
                }
            },
            onDatabaseFailure: async (record, error) => {
                try {
                    await db.query(`UPDATE batches SET blockchain_status = 'FAILED' WHERE id = $1;`, [batchId]);
                } catch (e) {
                    const b = inMemoryBatches.get(batchNumber);
                    if (b) b.blockchainStatus = 'FAILED';
                }
            }
        });

        return {
            id: batchId,
            batchNumber,
            gtin,
            manufacturingDate,
            expiryDate,
            quantity,
            proofHash,
            blockchainTxId: result.txId,
            blockchainStatus: 'COMMITTED'
        };
    }

    /**
     * List all products
     */
    async getAllProducts() {
        try {
            const res = await db.query(`
                SELECT p.*, o.name AS manufacturer_name 
                FROM products p 
                JOIN organizations o ON p.manufacturer_id = o.id
                ORDER BY p.created_at DESC;
            `);
            if (res.rows.length > 0) return res.rows;
        } catch (e) {}
        return Array.from(inMemoryProducts.values());
    }

    /**
     * List all batches
     */
    async getAllBatches() {
        try {
            const res = await db.query(`
                SELECT b.*, p.brand_name, p.generic_name, p.gtin
                FROM batches b
                JOIN products p ON b.product_id = p.id
                ORDER BY b.created_at DESC;
            `);
            if (res.rows.length > 0) return res.rows;
        } catch (e) {}
        return Array.from(inMemoryBatches.values());
    }
}

module.exports = new ProductService();

