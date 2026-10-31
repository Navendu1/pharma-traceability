// ==============================================================================
// PRODUCT, BATCH & SERIAL CONTROLLER
// File: backend/api/src/controllers/product.controller.js
// ==============================================================================

const productService = require('../services/product.service');
const { serialService } = require('../services/serial.service');

class ProductController {
    async createProduct(req, res, next) {
        try {
            const result = await productService.registerProduct(req.user, req.body);
            res.status(201).json({
                success: true,
                message: 'Product catalog registered successfully on blockchain and database',
                data: result
            });
        } catch (e) {
            next(e);
        }
    }

    async getProducts(req, res, next) {
        try {
            const products = await productService.getAllProducts();
            res.status(200).json({ success: true, count: products.length, data: products });
        } catch (e) {
            next(e);
        }
    }

    async createBatch(req, res, next) {
        try {
            const result = await productService.registerBatch(req.user, req.body);
            res.status(201).json({
                success: true,
                message: 'Production batch registered and proof hash committed to ledger',
                data: result
            });
        } catch (e) {
            next(e);
        }
    }

    async getBatches(req, res, next) {
        try {
            const batches = await productService.getAllBatches();
            res.status(200).json({ success: true, count: batches.length, data: batches });
        } catch (e) {
            next(e);
        }
    }

    async generateSerials(req, res, next) {
        try {
            const result = await serialService.generateSerials(req.user, req.body);
            res.status(201).json({
                success: true,
                message: `${result.totalGenerated} unique serial units created on blockchain and database`,
                data: result
            });
        } catch (e) {
            next(e);
        }
    }

    async getSerial(req, res, next) {
        try {
            const serial = await serialService.getSerial(req.params.serialNumber);
            if (!serial) {
                return res.status(404).json({ success: false, message: 'Serial unit not found' });
            }
            res.status(200).json({ success: true, data: serial });
        } catch (e) {
            next(e);
        }
    }

    async getSerialQR(req, res, next) {
        try {
            const { serialNumber } = req.params;
            const { generateVerificationUrl, generateQRCodeDataURL, generateQRCodeSVG } = require('../utils/qrGenerator');
            
            const verificationUrl = generateVerificationUrl(serialNumber);
            const qrDataUrl = await generateQRCodeDataURL(serialNumber);
            const svg = await generateQRCodeSVG(serialNumber);

            res.status(200).json({
                success: true,
                data: {
                    serialNumber,
                    verificationUrl,
                    qrDataUrl,
                    svg
                }
            });
        } catch (e) {
            next(e);
        }
    }
}

module.exports = new ProductController();

