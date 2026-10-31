// ==============================================================================
// QR GENERATOR UNIT TEST
// File: backend/api/src/tests/qr.test.js
// ==============================================================================

const { generateVerificationUrl, generateQRCodeDataURL, generateQRCodeSVG, formatGS1String } = require('../utils/qrGenerator');

async function testQR() {
    console.log('🧪 Testing QR Code & GS1 DataMatrix Serialization Engine...');

    const sampleSerial = 'MED-IN-7K4P-92XF-8Q2M';

    // 1. URL test
    const url = generateVerificationUrl(sampleSerial);
    console.log('1. Verification URL:', url);
    if (!url.includes('/verify/MED-IN-7K4P-92XF-8Q2M')) throw new Error('Invalid URL format');

    // 2. DataURL PNG test
    const dataUrl = await generateQRCodeDataURL(sampleSerial);
    console.log('2. QR Data URL (first 60 chars):', dataUrl.slice(0, 60) + '...');
    if (!dataUrl.startsWith('data:image/png;base64,')) throw new Error('Invalid PNG Data URI');

    // 3. SVG test
    const svg = await generateQRCodeSVG(sampleSerial);
    console.log('3. QR SVG XML (first 60 chars):', svg.slice(0, 60) + '...');
    if (!svg.includes('<svg')) throw new Error('Invalid SVG output');

    // 4. GS1 string test
    const gs1 = formatGS1String({
        gtin: '08901234567890',
        expiryDate: '2028-07-31',
        batchNumber: 'B2026-001',
        serialNumber: sampleSerial
    });
    console.log('4. GS1 AI Formatted String:', gs1);
    if (!gs1.includes('(01)08901234567890') || !gs1.includes('(21)MED-IN-7K4P-92XF-8Q2M')) throw new Error('Invalid GS1 format');

    console.log('🎉 ALL QR CODE ENGINE CHECKS PASSED!\n');
}

testQR();
