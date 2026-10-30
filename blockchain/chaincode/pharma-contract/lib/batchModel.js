// ==============================================================================
// BATCH MODEL HELPER
// File: blockchain/chaincode/pharma-contract/lib/batchModel.js
// ==============================================================================

class Batch {
    constructor(batchNumber, gtin, manufacturingDate, expiryDate, quantity, proofHash, manufacturerMspId, createdAt) {
        this.docType = 'BATCH';
        this.batchNumber = batchNumber;
        this.gtin = gtin;
        this.manufacturingDate = manufacturingDate;
        this.expiryDate = expiryDate;
        this.quantity = parseInt(quantity, 10);
        this.proofHash = proofHash;
        this.manufacturerMspId = manufacturerMspId;
        this.isRecalled = false;
        this.recallReason = null;
        this.recalledAt = null;
        this.createdAt = createdAt;
    }

    static makeKey(batchNumber) {
        return `BATCH_${batchNumber}`;
    }
}

class SerialUnit {
    constructor(serialNumber, batchNumber, gtin, manufacturerMspId, cryptographicSignature, createdAt) {
        this.docType = 'SERIAL_UNIT';
        this.serialNumber = serialNumber;
        this.batchNumber = batchNumber;
        this.gtin = gtin;
        this.currentCustodian = manufacturerMspId;
        this.manufacturerMspId = manufacturerMspId;
        this.status = 'CREATED'; // CREATED, DISPATCHED, IN_TRANSIT, STOCKED, SOLD, RECALLED, SUSPICIOUS
        this.cryptographicSignature = cryptographicSignature;
        this.custodyHistory = [
            {
                custodian: manufacturerMspId,
                status: 'CREATED',
                timestamp: createdAt,
                notes: 'Initial production serial creation'
            }
        ];
        this.soldAt = null;
        this.createdAt = createdAt;
        this.updatedAt = createdAt;
    }

    static makeKey(serialNumber) {
        return `SERIAL_${serialNumber}`;
    }
}

module.exports = {
    Batch,
    SerialUnit
};

