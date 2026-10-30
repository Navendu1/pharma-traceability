// ==============================================================================
// PHARMACEUTICAL TRACEABILITY SMART CONTRACT
// File: blockchain/chaincode/pharma-contract/lib/pharmaContract.js
// ==============================================================================

const { Contract } = require('fabric-contract-api');
const Product = require('./productModel');
const { Batch, SerialUnit } = require('./batchModel');
const Shipment = require('./shipmentModel');
const Recall = require('./recallModel');

class PharmaContract extends Contract {
    constructor() {
        super('PharmaContract');
    }

    /**
     * Helper to extract authenticated caller's Membership Service Provider (MSP) ID
     */
    _getCallerMSP(ctx) {
        return ctx.clientIdentity.getMSPID();
    }

    /**
     * Helper to format block timestamp as ISO 8601 string
     */
    _getTxTimestamp(ctx) {
        const timestamp = ctx.stub.getTxTimestamp();
        const milliseconds = (timestamp.seconds.low * 1000) + Math.round(timestamp.nanos / 1000000);
        return new Date(milliseconds).toISOString();
    }

    /**
     * Helper to check if a key exists on the ledger
     */
    async _assetExists(ctx, key) {
        const buffer = await ctx.stub.getState(key);
        return buffer && buffer.length > 0;
    }

    /**
     * 1. Register a new pharmaceutical product definition
     */
    async RegisterProduct(ctx, gtin, brandName, genericName, dosageForm, strength) {
        const callerMsp = this._getCallerMSP(ctx);

        // Access Control: Only Manufacturer can register product catalog
        if (callerMsp !== 'ManufacturerMSP') {
            throw new Error(`Unauthorized: Only 'ManufacturerMSP' can register products. Caller is '${callerMsp}'.`);
        }

        const key = Product.makeKey(gtin);
        if (await this._assetExists(ctx, key)) {
            throw new Error(`Conflict: Product with GTIN '${gtin}' already exists on ledger.`);
        }

        const timestamp = this._getTxTimestamp(ctx);
        const product = new Product(gtin, brandName, genericName, dosageForm, strength, callerMsp, timestamp);

        await ctx.stub.putState(key, Buffer.from(JSON.stringify(product)));

        // Emit block commit event
        ctx.stub.setEvent('ProductRegistered', Buffer.from(JSON.stringify({ gtin, brandName, callerMsp })));

        return JSON.stringify(product);
    }

    /**
     * 2. Register a new production batch
     */
    async RegisterBatch(ctx, batchNumber, gtin, manufacturingDate, expiryDate, quantity, proofHash) {
        const callerMsp = this._getCallerMSP(ctx);

        if (callerMsp !== 'ManufacturerMSP') {
            throw new Error(`Unauthorized: Only 'ManufacturerMSP' can register batches. Caller is '${callerMsp}'.`);
        }

        // Verify product catalog exists
        const productKey = Product.makeKey(gtin);
        if (!await this._assetExists(ctx, productKey)) {
            throw new Error(`Not Found: Product with GTIN '${gtin}' does not exist on ledger. Register product first.`);
        }

        const batchKey = Batch.makeKey(batchNumber);
        if (await this._assetExists(ctx, batchKey)) {
            throw new Error(`Conflict: Batch '${batchNumber}' already registered on ledger.`);
        }

        // Validate dates
        if (new Date(expiryDate) <= new Date(manufacturingDate)) {
            throw new Error(`Validation Error: Expiry date (${expiryDate}) must be strictly after manufacturing date (${manufacturingDate}).`);
        }

        const timestamp = this._getTxTimestamp(ctx);
        const batch = new Batch(batchNumber, gtin, manufacturingDate, expiryDate, quantity, proofHash, callerMsp, timestamp);

        await ctx.stub.putState(batchKey, Buffer.from(JSON.stringify(batch)));

        ctx.stub.setEvent('BatchRegistered', Buffer.from(JSON.stringify({ batchNumber, gtin, quantity })));

        return JSON.stringify(batch);
    }

    /**
     * 3. Register an individual unit serialization
     */
    async CreateSerial(ctx, serialNumber, batchNumber, cryptographicSignature) {
        const callerMsp = this._getCallerMSP(ctx);

        if (callerMsp !== 'ManufacturerMSP') {
            throw new Error(`Unauthorized: Only 'ManufacturerMSP' can serialize units.`);
        }

        const batchKey = Batch.makeKey(batchNumber);
        const batchBuffer = await ctx.stub.getState(batchKey);
        if (!batchBuffer || batchBuffer.length === 0) {
            throw new Error(`Not Found: Batch '${batchNumber}' does not exist.`);
        }
        const batch = JSON.parse(batchBuffer.toString());

        const serialKey = SerialUnit.makeKey(serialNumber);
        if (await this._assetExists(ctx, serialKey)) {
            throw new Error(`Conflict: Serial '${serialNumber}' already exists on ledger.`);
        }

        const timestamp = this._getTxTimestamp(ctx);
        const unit = new SerialUnit(serialNumber, batchNumber, batch.gtin, callerMsp, cryptographicSignature, timestamp);

        await ctx.stub.putState(serialKey, Buffer.from(JSON.stringify(unit)));

        return JSON.stringify(unit);
    }

    /**
     * 4. Dispatch a shipment containing specified serial numbers
     */
    async DispatchShipment(ctx, shipmentCode, receiverMspId, serialNumbersJson) {
        const callerMsp = this._getCallerMSP(ctx);
        const serialNumbers = JSON.parse(serialNumbersJson);

        if (!Array.isArray(serialNumbers) || serialNumbers.length === 0) {
            throw new Error(`Validation Error: serialNumbers must be a non-empty JSON array.`);
        }

        const shipmentKey = Shipment.makeKey(shipmentCode);
        if (await this._assetExists(ctx, shipmentKey)) {
            throw new Error(`Conflict: Shipment code '${shipmentCode}' already exists.`);
        }

        const timestamp = this._getTxTimestamp(ctx);

        // Validate custody of all units before dispatching
        for (const serialNo of serialNumbers) {
            const serialKey = SerialUnit.makeKey(serialNo);
            const serialBytes = await ctx.stub.getState(serialKey);
            if (!serialBytes || serialBytes.length === 0) {
                throw new Error(`Not Found: Serial number '${serialNo}' is not registered on ledger.`);
            }

            const unit = JSON.parse(serialBytes.toString());

            // Zero-Trust: Caller must be the current custodian
            if (unit.currentCustodian !== callerMsp) {
                throw new Error(`Unauthorized: Caller '${callerMsp}' is not the current custodian of serial '${serialNo}'. Current custodian: '${unit.currentCustodian}'.`);
            }

            if (unit.status === 'RECALLED' || unit.status === 'SOLD') {
                throw new Error(`Illegal State: Serial '${serialNo}' has status '${unit.status}' and cannot be dispatched.`);
            }

            // Update unit state to IN_TRANSIT
            unit.status = 'IN_TRANSIT';
            unit.updatedAt = timestamp;
            unit.custodyHistory.push({
                custodian: callerMsp,
                status: 'DISPATCHED',
                timestamp,
                notes: `Dispatched in shipment ${shipmentCode} to ${receiverMspId}`
            });

            await ctx.stub.putState(serialKey, Buffer.from(JSON.stringify(unit)));
        }

        const shipment = new Shipment(shipmentCode, callerMsp, receiverMspId, serialNumbers, timestamp);
        await ctx.stub.putState(shipmentKey, Buffer.from(JSON.stringify(shipment)));

        ctx.stub.setEvent('ShipmentDispatched', Buffer.from(JSON.stringify({ shipmentCode, senderMspId: callerMsp, receiverMspId })));

        return JSON.stringify(shipment);
    }

    /**
     * 5. Confirm receipt of an inbound shipment
     */
    async ReceiveShipment(ctx, shipmentCode) {
        const callerMsp = this._getCallerMSP(ctx);
        const shipmentKey = Shipment.makeKey(shipmentCode);
        const shipmentBytes = await ctx.stub.getState(shipmentKey);

        if (!shipmentBytes || shipmentBytes.length === 0) {
            throw new Error(`Not Found: Shipment '${shipmentCode}' does not exist.`);
        }

        const shipment = JSON.parse(shipmentBytes.toString());

        // Access Control: Only designated receiver can receive shipment
        if (shipment.receiverMspId !== callerMsp) {
            throw new Error(`Unauthorized: Caller '${callerMsp}' is not the designated receiver '${shipment.receiverMspId}' of shipment '${shipmentCode}'.`);
        }

        if (shipment.status !== 'DISPATCHED') {
            throw new Error(`Illegal State: Shipment '${shipmentCode}' is in status '${shipment.status}'. Expected: 'DISPATCHED'.`);
        }

        const timestamp = this._getTxTimestamp(ctx);
        shipment.status = 'DELIVERED';
        shipment.deliveryTimestamp = timestamp;

        // Transfer custody of all contained serials to the receiving organization
        for (const serialNo of shipment.serialNumbers) {
            const serialKey = SerialUnit.makeKey(serialNo);
            const serialBytes = await ctx.stub.getState(serialKey);
            const unit = JSON.parse(serialBytes.toString());

            unit.currentCustodian = callerMsp;
            unit.status = 'STOCKED';
            unit.updatedAt = timestamp;
            unit.custodyHistory.push({
                custodian: callerMsp,
                status: 'RECEIVED',
                timestamp,
                notes: `Inward receipt accepted for shipment ${shipmentCode}`
            });

            await ctx.stub.putState(serialKey, Buffer.from(JSON.stringify(unit)));
        }

        await ctx.stub.putState(shipmentKey, Buffer.from(JSON.stringify(shipment)));

        ctx.stub.setEvent('ShipmentReceived', Buffer.from(JSON.stringify({ shipmentCode, receiverMspId: callerMsp })));

        return JSON.stringify(shipment);
    }

    /**
     * 6. Direct Custody Handover between organizations
     */
    async TransferCustody(ctx, serialNumber, newCustodianMspId, handoverNotes) {
        const callerMsp = this._getCallerMSP(ctx);
        const serialKey = SerialUnit.makeKey(serialNumber);
        const serialBytes = await ctx.stub.getState(serialKey);

        if (!serialBytes || serialBytes.length === 0) {
            throw new Error(`Not Found: Serial '${serialNumber}' does not exist.`);
        }

        const unit = JSON.parse(serialBytes.toString());

        if (unit.currentCustodian !== callerMsp) {
            throw new Error(`Unauthorized: Caller '${callerMsp}' is not the current custodian of serial '${serialNumber}'.`);
        }

        if (unit.status === 'RECALLED' || unit.status === 'SOLD') {
            throw new Error(`Illegal State: Cannot transfer custody of a ${unit.status} unit.`);
        }

        const timestamp = this._getTxTimestamp(ctx);
        unit.currentCustodian = newCustodianMspId;
        unit.updatedAt = timestamp;
        unit.custodyHistory.push({
            custodian: newCustodianMspId,
            status: 'CUSTODY_TRANSFER',
            timestamp,
            notes: handoverNotes || `Custody transferred from ${callerMsp} to ${newCustodianMspId}`
        });

        await ctx.stub.putState(serialKey, Buffer.from(JSON.stringify(unit)));

        ctx.stub.setEvent('CustodyTransferred', Buffer.from(JSON.stringify({ serialNumber, from: callerMsp, to: newCustodianMspId })));

        return JSON.stringify(unit);
    }

    /**
     * 7. Record a final sale / dispensing event to a patient/consumer
     */
    async RecordSale(ctx, serialNumber, pharmacyLicense, saleReceiptHash) {
        const callerMsp = this._getCallerMSP(ctx);
        const serialKey = SerialUnit.makeKey(serialNumber);
        const serialBytes = await ctx.stub.getState(serialKey);

        if (!serialBytes || serialBytes.length === 0) {
            throw new Error(`Not Found: Serial '${serialNumber}' does not exist.`);
        }

        const unit = JSON.parse(serialBytes.toString());

        if (unit.currentCustodian !== callerMsp) {
            throw new Error(`Unauthorized: Only the current stocking pharmacy can record sale. Caller is '${callerMsp}'.`);
        }

        if (unit.status === 'SOLD') {
            throw new Error(`Illegal State: Serial '${serialNumber}' is ALREADY SOLD. Possible counterfeit duplicate!`);
        }

        if (unit.status === 'RECALLED') {
            throw new Error(`Illegal State: Cannot sell RECALLED product.`);
        }

        const timestamp = this._getTxTimestamp(ctx);
        unit.status = 'SOLD';
        unit.soldAt = timestamp;
        unit.updatedAt = timestamp;
        unit.custodyHistory.push({
            custodian: 'CONSUMER',
            status: 'SOLD',
            timestamp,
            notes: `Dispensed at Pharmacy License: ${pharmacyLicense}. Receipt Hash: ${saleReceiptHash}`
        });

        await ctx.stub.putState(serialKey, Buffer.from(JSON.stringify(unit)));

        ctx.stub.setEvent('ProductSold', Buffer.from(JSON.stringify({ serialNumber, pharmacyLicense, timestamp })));

        return JSON.stringify(unit);
    }

    /**
     * 8. Trigger an immediate batch recall
     */
    async RecallBatch(ctx, batchNumber, reason, severity) {
        const callerMsp = this._getCallerMSP(ctx);
        const batchKey = Batch.makeKey(batchNumber);
        const batchBytes = await ctx.stub.getState(batchKey);

        if (!batchBytes || batchBytes.length === 0) {
            throw new Error(`Not Found: Batch '${batchNumber}' does not exist.`);
        }

        const batch = JSON.parse(batchBytes.toString());

        // Access Control: Only originating manufacturer or regulator can recall
        if (callerMsp !== batch.manufacturerMspId && callerMsp !== 'RegulatorMSP') {
            throw new Error(`Unauthorized: Only originating manufacturer '${batch.manufacturerMspId}' or 'RegulatorMSP' can recall this batch.`);
        }

        const timestamp = this._getTxTimestamp(ctx);
        batch.isRecalled = true;
        batch.recallReason = reason;
        batch.recalledAt = timestamp;

        await ctx.stub.putState(batchKey, Buffer.from(JSON.stringify(batch)));

        const recallRecord = new Recall(`REC_${batchNumber}`, batchNumber, callerMsp, reason, severity, timestamp);
        await ctx.stub.putState(Recall.makeKey(batchNumber), Buffer.from(JSON.stringify(recallRecord)));

        ctx.stub.setEvent('BatchRecalled', Buffer.from(JSON.stringify({ batchNumber, reason, severity, callerMsp })));

        return JSON.stringify({ batch, recall: recallRecord });
    }

    /**
     * 9. Query & verify a serial number's authenticity and state
     */
    async VerifyProduct(ctx, serialNumber) {
        const serialKey = SerialUnit.makeKey(serialNumber);
        const serialBytes = await ctx.stub.getState(serialKey);

        if (!serialBytes || serialBytes.length === 0) {
            return JSON.stringify({
                exists: false,
                verificationStatus: 'UNKNOWN_SERIAL',
                message: 'Warning: This serial number does not exist in the official blockchain registry.'
            });
        }

        const unit = JSON.parse(serialBytes.toString());

        // Fetch corresponding batch
        const batchKey = Batch.makeKey(unit.batchNumber);
        const batchBytes = await ctx.stub.getState(batchKey);
        const batch = JSON.parse(batchBytes.toString());

        // Fetch corresponding product
        const productKey = Product.makeKey(batch.gtin);
        const productBytes = await ctx.stub.getState(productKey);
        const product = JSON.parse(productBytes.toString());

        const now = new Date(this._getTxTimestamp(ctx));
        const expiry = new Date(batch.expiryDate);
        const isExpired = now > expiry;

        let verificationStatus = 'AUTHENTIC';
        if (batch.isRecalled) {
            verificationStatus = 'RECALLED';
        } else if (isExpired) {
            verificationStatus = 'EXPIRED';
        } else if (unit.status === 'SOLD') {
            verificationStatus = 'ALREADY_SOLD';
        }

        return JSON.stringify({
            exists: true,
            verificationStatus,
            serialNumber: unit.serialNumber,
            status: unit.status,
            currentCustodian: unit.currentCustodian,
            soldAt: unit.soldAt,
            batch: {
                batchNumber: batch.batchNumber,
                manufacturingDate: batch.manufacturingDate,
                expiryDate: batch.expiryDate,
                isRecalled: batch.isRecalled,
                recallReason: batch.recallReason
            },
            product: {
                gtin: product.gtin,
                brandName: product.brandName,
                genericName: product.genericName,
                dosageForm: product.dosageForm,
                strength: product.strength,
                manufacturerMspId: product.manufacturerMspId
            },
            custodyHistory: unit.custodyHistory
        });
    }

    /**
     * 10. Retrieve the complete chronological modification history of a serial
     */
    async GetProductHistory(ctx, serialNumber) {
        const serialKey = SerialUnit.makeKey(serialNumber);
        const iterator = await ctx.stub.getHistoryForKey(serialKey);
        const history = [];

        let result = await iterator.next();
        while (!result.done) {
            if (result.value) {
                const tx = {
                    txId: result.value.txId,
                    timestamp: new Date((result.value.timestamp.seconds.low * 1000)).toISOString(),
                    isDelete: result.value.isDelete
                };
                if (!result.value.isDelete) {
                    tx.value = JSON.parse(result.value.value.toString('utf8'));
                }
                history.push(tx);
            }
            result = await iterator.next();
        }
        await iterator.close();

        return JSON.stringify(history);
    }
}

module.exports = PharmaContract;
