// ==============================================================================
// SHIPMENT MODEL HELPER
// File: blockchain/chaincode/pharma-contract/lib/shipmentModel.js
// ==============================================================================

class Shipment {
    constructor(shipmentCode, senderMspId, receiverMspId, serialNumbers, dispatchTimestamp) {
        this.docType = 'SHIPMENT';
        this.shipmentCode = shipmentCode;
        this.senderMspId = senderMspId;
        this.receiverMspId = receiverMspId;
        this.serialNumbers = serialNumbers;
        this.status = 'DISPATCHED'; // DISPATCHED, DELIVERED, REJECTED
        this.dispatchTimestamp = dispatchTimestamp;
        this.deliveryTimestamp = null;
    }

    static makeKey(shipmentCode) {
        return `SHIPMENT_${shipmentCode}`;
    }
}

module.exports = Shipment;
