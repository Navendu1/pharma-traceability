// ==============================================================================
// SHIPMENT INPUT VALIDATORS
// File: backend/api/src/validators/shipment.validator.js
// ==============================================================================

const { z } = require('zod');

const dispatchShipmentSchema = z.object({
    shipmentCode: z.string().min(4).max(50).trim().toUpperCase(),
    receiverOrgId: z.string().uuid('Valid Receiver Organization UUID is required'),
    receiverMspId: z.string().min(3).max(50),
    serialNumbers: z.array(z.string()).min(1, 'At least one serial number is required'),
    notes: z.string().optional().default('')
});

const receiveShipmentSchema = z.object({
    shipmentCode: z.string().min(4).max(50).trim().toUpperCase()
});

const createRecallSchema = z.object({
    batchNumber: z.string().min(3).max(50).trim().toUpperCase(),
    reason: z.string().min(10, 'Recall reason must be at least 10 characters long'),
    severity: z.enum(['CLASS_I_CRITICAL', 'CLASS_II_SERIOUS', 'CLASS_III_MINOR'])
});

module.exports = {
    dispatchShipmentSchema,
    receiveShipmentSchema,
    createRecallSchema
};
