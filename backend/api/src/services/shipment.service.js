// ==============================================================================
// SHIPMENT & CUSTODY SERVICE
// File: backend/api/src/services/shipment.service.js
// ==============================================================================

const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const blockchainService = require('./blockchain.service');
const { inMemorySerials } = require('./serial.service');
const logger = require('../utils/logger');

const inMemoryShipments = new Map();

class ShipmentService {
    /**
     * Dispatch shipment and mark units as IN_TRANSIT
     */
    async dispatchShipment(senderUser, { shipmentCode, receiverOrgId, receiverMspId, serialNumbers, notes }) {
        logger.info(`Dispatching shipment ${shipmentCode} to ${receiverMspId} with ${serialNumbers.length} items`);
        const shipmentId = uuidv4();

        // 1. Submit Dispatch to Fabric Gateway
        const fabricResult = await blockchainService.submitTransaction(
            senderUser.mspId,
            'DispatchShipment',
            shipmentCode,
            receiverMspId,
            JSON.stringify(serialNumbers)
        );

        // 2. Update Database & in-memory units
        try {
            await db.query(`
                INSERT INTO shipments (id, shipment_code, sender_org_id, receiver_org_id, status, dispatch_date, blockchain_status, blockchain_tx_id, notes)
                VALUES ($1, $2, $3, $4, 'DISPATCHED', CURRENT_TIMESTAMP, 'COMMITTED', $5, $6);
            `, [shipmentId, shipmentCode, senderUser.organizationId, receiverOrgId, fabricResult.txId, notes]);

            for (const sNo of serialNumbers) {
                await db.query(`
                    UPDATE serial_units SET status = 'IN_TRANSIT' WHERE serial_number = $1;
                    INSERT INTO supply_events (serial_unit_id, shipment_id, event_type, actor_user_id, organization_id, blockchain_tx_id)
                    VALUES ((SELECT id FROM serial_units WHERE serial_number = $1), $2, 'DISPATCHED', $3, $4, $5);
                `, [sNo, shipmentId, senderUser.id, senderUser.organizationId, fabricResult.txId]);
            }
        } catch (e) {
            inMemoryShipments.set(shipmentCode, {
                id: shipmentId,
                shipmentCode,
                senderOrgId: senderUser.organizationId,
                senderMspId: senderUser.mspId,
                receiverOrgId,
                receiverMspId,
                serialNumbers,
                status: 'DISPATCHED',
                blockchainTxId: fabricResult.txId,
                notes,
                dispatchDate: new Date().toISOString()
            });

            for (const sNo of serialNumbers) {
                const unit = inMemorySerials.get(sNo);
                if (unit) {
                    unit.status = 'IN_TRANSIT';
                }
            }
        }

        return {
            id: shipmentId,
            shipmentCode,
            status: 'DISPATCHED',
            totalUnits: serialNumbers.length,
            blockchainTxId: fabricResult.txId
        };
    }

    /**
     * Inward Receipt: Accept shipment and transfer custody to receiver
     */
    async receiveShipment(receiverUser, { shipmentCode }) {
        logger.info(`Confirming inward receipt for shipment ${shipmentCode} by ${receiverUser.mspId}`);

        // 1. Submit Receive to Fabric Gateway
        const fabricResult = await blockchainService.submitTransaction(
            receiverUser.mspId,
            'ReceiveShipment',
            shipmentCode
        );

        // 2. Update Database & in-memory units
        try {
            await db.query(`
                UPDATE shipments 
                SET status = 'DELIVERED', delivery_date = CURRENT_TIMESTAMP, blockchain_tx_id = $1
                WHERE shipment_code = $2;
            `, [fabricResult.txId, shipmentCode]);

            const items = await db.query(`
                SELECT s.serial_number 
                FROM shipment_items si
                JOIN shipments sh ON si.shipment_id = sh.id
                JOIN serial_units s ON si.serial_unit_id = s.id
                WHERE sh.shipment_code = $1;
            `, [shipmentCode]);

            for (const row of items.rows) {
                await db.query(`
                    UPDATE serial_units 
                    SET status = 'STOCKED', current_custodian_id = $1 
                    WHERE serial_number = $2;

                    INSERT INTO supply_events (serial_unit_id, event_type, actor_user_id, organization_id, blockchain_tx_id)
                    VALUES ((SELECT id FROM serial_units WHERE serial_number = $2), 'RECEIVED', $3, $1, $4);
                `, [receiverUser.organizationId, row.serial_number, receiverUser.id, fabricResult.txId]);
            }
        } catch (e) {
            const ship = inMemoryShipments.get(shipmentCode);
            if (ship) {
                ship.status = 'DELIVERED';
                ship.deliveryDate = new Date().toISOString();
                for (const sNo of ship.serialNumbers) {
                    const unit = inMemorySerials.get(sNo);
                    if (unit) {
                        unit.status = 'STOCKED';
                        unit.currentCustodianId = receiverUser.organizationId;
                        unit.currentCustodianMsp = receiverUser.mspId;
                    }
                }
            }
        }

        return {
            shipmentCode,
            status: 'DELIVERED',
            receiverMspId: receiverUser.mspId,
            blockchainTxId: fabricResult.txId
        };
    }

    /**
     * List shipments
     */
    async getAllShipments(userOrgId) {
        try {
            const res = await db.query(`
                SELECT s.*, o1.name AS sender_name, o2.name AS receiver_name
                FROM shipments s
                JOIN organizations o1 ON s.sender_org_id = o1.id
                JOIN organizations o2 ON s.receiver_org_id = o2.id
                WHERE s.sender_org_id = $1 OR s.receiver_org_id = $1
                ORDER BY s.created_at DESC;
            `, [userOrgId]);
            if (res.rows.length > 0) return res.rows;
        } catch (e) {}

        return Array.from(inMemoryShipments.values());
    }
}

module.exports = new ShipmentService();
