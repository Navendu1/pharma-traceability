// ==============================================================================
// RECALL CONTROLLER
// File: backend/api/src/controllers/recall.controller.js
// ==============================================================================

const recallService = require('../services/recall.service');

class RecallController {
    async createRecall(req, res, next) {
        try {
            const result = await recallService.initiateRecall(req.user, req.body);
            res.status(201).json({
                success: true,
                message: 'Batch recall broadcast committed to blockchain ledger',
                data: result
            });
        } catch (e) {
            next(e);
        }
    }

    async getRecalls(req, res, next) {
        try {
            const recalls = await recallService.getAllRecalls();
            res.status(200).json({ success: true, count: recalls.length, data: recalls });
        } catch (e) {
            next(e);
        }
    }
}

module.exports = new RecallController();

