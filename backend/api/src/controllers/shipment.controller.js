// ==============================================================================
// SHIPMENT CONTROLLER
// File: backend/api/src/controllers/shipment.controller.js
// ==============================================================================

const shipmentService = require('../services/shipment.service');

class ShipmentController {
    async dispatch(req, res, next) {
        try {
            const result = await shipmentService.dispatchShipment(req.user, req.body);
            res.status(201).json({
                success: true,
                message: 'Shipment dispatched and units transitioned to IN_TRANSIT on blockchain',
                data: result
            });
        } catch (e) {
            next(e);
        }
    }

    async receive(req, res, next) {
        try {
            const result = await shipmentService.receiveShipment(req.user, req.body);
            res.status(200).json({
                success: true,
                message: 'Inward receipt accepted and serial custody transferred on blockchain',
                data: result
            });
        } catch (e) {
            next(e);
        }
    }

    async getShipments(req, res, next) {
        try {
            const shipments = await shipmentService.getAllShipments(req.user.organizationId);
            res.status(200).json({ success: true, count: shipments.length, data: shipments });
        } catch (e) {
            next(e);
        }
    }
}

module.exports = new ShipmentController();

