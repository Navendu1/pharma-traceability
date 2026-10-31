// ==============================================================================
// SHIPMENT ROUTES
// File: backend/api/src/routes/shipment.routes.js
// ==============================================================================

const express = require('express');
const router = express.Router();
const shipmentController = require('../controllers/shipment.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validation.middleware');
const { dispatchShipmentSchema, receiveShipmentSchema } = require('../validators/shipment.validator');

// Dispatch shipment
router.post(
    '/dispatch',
    authenticate,
    validate(dispatchShipmentSchema),
    shipmentController.dispatch
);

// Receive shipment
router.post(
    '/receive',
    authenticate,
    validate(receiveShipmentSchema),
    shipmentController.receive
);

// List shipments
router.get('/', authenticate, shipmentController.getShipments);

module.exports = router;

