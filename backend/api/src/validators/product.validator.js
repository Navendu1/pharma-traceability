// ==============================================================================
// PRODUCT & BATCH INPUT VALIDATORS
// File: backend/api/src/validators/product.validator.js
// ==============================================================================

const { z } = require('zod');

const createProductSchema = z.object({
    gtin: z
        .string({ required_error: 'GTIN (14 numeric digits) is required' })
        .length(14, 'GTIN must be exactly 14 digits')
        .regex(/^[0-9]+$/, 'GTIN must contain only numbers'),
    brandName: z.string().min(2).max(100).trim(),
    genericName: z.string().min(2).max(100).trim(),
    dosageForm: z.string().min(2).max(50).trim(),
    strength: z.string().min(1).max(50).trim(),
    storageConditions: z.string().optional().default('Store below 25°C in a dry place'),
    description: z.string().optional().default('')
});

const createBatchSchema = z.object({
    productId: z.string().uuid().optional(),
    gtin: z.string().length(14),
    batchNumber: z.string().min(3).max(50).trim().toUpperCase(),
    manufacturingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD format'),
    expiryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD format'),
    quantity: z.number().int().positive('Quantity must be greater than zero')
}).refine(data => new Date(data.expiryDate) > new Date(data.manufacturingDate), {
    message: 'Expiry date must be after manufacturing date',
    path: ['expiryDate']
});

const generateSerialsSchema = z.object({
    batchNumber: z.string().min(3).max(50),
    count: z.number().int().min(1).max(500, 'Batch serial generation maximum is 500 per request')
});

module.exports = {
    createProductSchema,
    createBatchSchema,
    generateSerialsSchema
};

