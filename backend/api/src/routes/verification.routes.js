// ==============================================================================
// VERIFICATION ROUTES (PUBLIC)
// File: backend/api/src/routes/verification.routes.js
// ==============================================================================

const express = require('express');
const router = express.Router();
const verificationController = require('../controllers/verification.controller');

// Public route for consumer verification & mobile scanner
router.get('/verify/:serialNumber', verificationController.verify);

// Public route for viewing on-chain history
router.get('/history/:serialNumber', verificationController.getHistory);

module.exports = router;
