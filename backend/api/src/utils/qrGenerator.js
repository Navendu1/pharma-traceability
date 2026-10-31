// ==============================================================================
// QR CODE & GS1 PACKAGING SERIALIZATION GENERATOR
// File: backend/api/src/utils/qrGenerator.js
// ==============================================================================

const QRCode = require('qrcode');
const config = require('../config/environment');

/**
 * Constructs the canonical public verification URL for a given serial number
 * @param {string} serialNumber - e.g. 'MED-IN-7K4P-92XF-8Q2M'
 * @returns {string} Fully qualified verification URL
 */
function generateVerificationUrl(serialNumber) {
    const webHost = config.corsOrigin[0] || 'http://localhost:5173';
    return `${webHost}/verify/${encodeURIComponent(serialNumber)}`;
}

/**
 * Generate a Base64-encoded PNG Data URI for rendering in web dashboards and printing
 * @param {string} serialNumber - Serial identifier
 * @param {object} options - QRCode generation options
 * @returns {Promise<string>} Base64 Data URI ('data:image/png;base64,...')
 */
async function generateQRCodeDataURL(serialNumber, options = {}) {
    const verificationUrl = generateVerificationUrl(serialNumber);
    
    const qrOptions = {
        errorCorrectionLevel: 'H', // High error correction (30% damage recovery)
        type: 'image/png',
        quality: 0.95,
        margin: 2,
        color: {
            dark: '#1B365D',      // Brand Navy Blue
            light: '#FFFFFF'     // White background
        },
        width: options.width || 300,
        ...options
    };

    return await QRCode.toDataURL(verificationUrl, qrOptions);
}

/**
 * Generate a Vector SVG string suitable for industrial package printing
 * @param {string} serialNumber - Serial identifier
 * @returns {Promise<string>} Raw SVG XML string
 */
async function generateQRCodeSVG(serialNumber) {
    const verificationUrl = generateVerificationUrl(serialNumber);
    return await QRCode.toString(verificationUrl, {
        type: 'svg',
        errorCorrectionLevel: 'H',
        margin: 1,
        color: {
            dark: '#1B365D',
            light: '#FFFFFF'
        }
    });
}

/**
 * Format GS1 DataMatrix string using standard Application Identifiers (AI)
 * (01) = GTIN (14 digits)
 * (17) = Expiry Date (YYMMDD)
 * (10) = Batch / Lot Number
 * (21) = Serial Number
 */
function formatGS1String({ gtin, expiryDate, batchNumber, serialNumber }) {
    // Format date as YYMMDD
    const d = new Date(expiryDate);
    const yy = String(d.getFullYear()).slice(-2);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const yymmdd = `${yy}${mm}${dd}`;

    return `(01)${gtin}(17)${yymmdd}(10)${batchNumber}(21)${serialNumber}`;
}

module.exports = {
    generateVerificationUrl,
    generateQRCodeDataURL,
    generateQRCodeSVG,
    formatGS1String
};
