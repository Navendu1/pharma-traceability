// ==============================================================================
// PRODUCT, BATCH & SERIAL ROUTES
// File: backend/api/src/routes/product.routes.js
// ==============================================================================

const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorizeRoles, authorizeOrgTypes } = require('../middleware/rbac.middleware');
const { validate } = require('../middleware/validation.middleware');
const { createProductSchema, createBatchSchema, generateSerialsSchema } = require('../validators/product.validator');

// 1. Product Catalog Endpoints
router.post(
    '/',
    authenticate,
    authorizeOrgTypes('MANUFACTURER'),
    authorizeRoles('ORG_ADMIN', 'OPERATOR'),
    validate(createProductSchema),
    productController.createProduct
);

router.get('/', authenticate, productController.getProducts);

// 2. Batch Registration Endpoints
router.post(
    '/batches',
    authenticate,
    authorizeOrgTypes('MANUFACTURER'),
    authorizeRoles('ORG_ADMIN', 'OPERATOR'),
    validate(createBatchSchema),
    productController.createBatch
);

router.get('/batches', authenticate, productController.getBatches);

// 3. Serial Generation Endpoints
router.post(
    '/serials/generate',
    authenticate,
    authorizeOrgTypes('MANUFACTURER'),
    authorizeRoles('ORG_ADMIN', 'OPERATOR'),
    validate(generateSerialsSchema),
    productController.generateSerials
);

router.get('/serials/:serialNumber', authenticate, productController.getSerial);
router.get('/serials/:serialNumber/qr', productController.getSerialQR);

module.exports = router;

