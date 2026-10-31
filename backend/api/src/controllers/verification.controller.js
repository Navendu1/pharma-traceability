// ==============================================================================
// VERIFICATION CONTROLLER (PUBLIC ACCESS)
// File: backend/api/src/controllers/verification.controller.js
// ==============================================================================

const verificationService = require('../services/verification.service');

class VerificationController {
    async verify(req, res, next) {
        try {
            const { serialNumber } = req.params;
            const metadata = {
                ip: req.ip || req.headers['x-forwarded-for'],
                city: req.query.city || 'Kolkata'
            };
            const result = await verificationService.verifySerial(serialNumber, metadata);
            res.status(200).json({ success: true, data: result });
        } catch (e) {
            next(e);
        }
    }

    async getHistory(req, res, next) {
        try {
            const { serialNumber } = req.params;
            const history = await verificationService.getProductHistory(serialNumber);
            res.status(200).json({ success: true, data: history });
        } catch (e) {
            next(e);
        }
    }
}

module.exports = new VerificationController();

