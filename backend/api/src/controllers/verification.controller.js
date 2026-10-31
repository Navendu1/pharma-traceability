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
                ip: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1',
                userAgent: req.headers['user-agent'] || 'Web-Browser',
                city: req.query.city || (req.body && req.body.city) || 'Kolkata',
                latitude: req.query.latitude || (req.body && req.body.latitude),
                longitude: req.query.longitude || (req.body && req.body.longitude),
                coordinates: req.query.coordinates || (req.body && req.body.coordinates)
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
