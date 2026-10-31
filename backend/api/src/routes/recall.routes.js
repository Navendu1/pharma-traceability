// ==============================================================================
// RECALL ROUTES
// File: backend/api/src/routes/recall.routes.js
// ==============================================================================

const express = require('express');
const router = express.Router();
const recallController = require('../controllers/recall.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorizeRoles, authorizeOrgTypes } = require('../middleware/rbac.middleware');
const { validate } = require('../middleware/validation.middleware');
const { createRecallSchema } = require('../validators/shipment.validator');

// Trigger recall (Only Manufacturer OR Regulator)
router.post(
    '/',
    authenticate,
    authorizeOrgTypes('MANUFACTURER', 'REGULATOR'),
    authorizeRoles('ORG_ADMIN', 'INSPECTOR'),
    validate(createRecallSchema),
    recallController.createRecall
);

// List recalls
router.get('/', authenticate, recallController.getRecalls);

module.exports = router;
