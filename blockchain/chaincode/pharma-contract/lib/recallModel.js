// ==============================================================================
// RECALL MODEL HELPER
// File: blockchain/chaincode/pharma-contract/lib/recallModel.js
// ==============================================================================

class Recall {
    constructor(recallId, batchNumber, initiatorMspId, reason, severity, timestamp) {
        this.docType = 'RECALL';
        this.recallId = recallId;
        this.batchNumber = batchNumber;
        this.initiatorMspId = initiatorMspId;
        this.reason = reason;
        this.severity = severity; // CLASS_I_CRITICAL, CLASS_II_SERIOUS, CLASS_III_MINOR
        this.timestamp = timestamp;
        this.status = 'ACTIVE';
    }

    static makeKey(batchNumber) {
        return `RECALL_${batchNumber}`;
    }
}

module.exports = Recall;
