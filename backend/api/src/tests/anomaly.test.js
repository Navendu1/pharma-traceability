// ==============================================================================
// STAGE 11: ANOMALY DETECTION ENGINE & VELOCITY ANALYTICS TEST SUITE
// File: backend/api/src/tests/anomaly.test.js
// ==============================================================================

const http = require('http');
const app = require('../app');
const config = require('../config/environment');
const anomalyService = require('../services/anomaly.service');
const verificationService = require('../services/verification.service');
const blockchainService = require('../services/blockchain.service');

let passedTests = 0;
let totalTests = 0;
let server = null;
let baseUrl = null;

function assert(condition, message) {
    totalTests++;
    if (condition) {
        console.log(`  ✓ [PASS] ${message}`);
        passedTests++;
    } else {
        console.error(`  ✗ [FAIL] ${message}`);
        throw new Error(`Assertion failed: ${message}`);
    }
}

function makeRequest(method, path, body = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, baseUrl);
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + (url.search || ''),
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    resolve({ status: res.statusCode, data: parsed, headers: res.headers });
                } catch (e) {
                    resolve({ status: res.statusCode, raw: data, headers: res.headers });
                }
            });
        });

        req.on('error', reject);
        if (body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
}

async function runAnomalyTests() {
    console.log('\n==============================================================================');
    console.log('🧪 RUNNING STAGE 11: ANOMALY DETECTION & VELOCITY ENGINE TEST SUITE');
    console.log('==============================================================================\n');

    anomalyService.clearCache();

    // --------------------------------------------------------------------------
    // TEST 1: Haversine Distance Calculation Accuracy
    // --------------------------------------------------------------------------
    console.log('Test 1: Mathematical Distance & Geolocation Computations');
    const kolkata = { lat: 22.5726, lon: 88.3639 };
    const mumbai = { lat: 19.0760, lon: 72.8777 };

    const distSame = anomalyService.haversineDistance(kolkata.lat, kolkata.lon, kolkata.lat, kolkata.lon);
    assert(Math.round(distSame) === 0, 'Distance between identical points is 0 km');

    const distKolkataMumbai = anomalyService.haversineDistance(kolkata.lat, kolkata.lon, mumbai.lat, mumbai.lon);
    assert(distKolkataMumbai > 1640 && distKolkataMumbai < 1670, `Haversine distance between Kolkata and Mumbai is ~1654 km (Calculated: ${Math.round(distKolkataMumbai)} km)`);

    // --------------------------------------------------------------------------
    // TEST 2: Unregistered Serial Detection (Counterfeit Anomaly)
    // --------------------------------------------------------------------------
    console.log('\nTest 2: Unknown Serial Detection');
    const unknownAssessment = await anomalyService.analyzeScan('FAKE-SERIAL-UNKNOWN-999', { city: 'Kolkata' }, { exists: false });
    assert(unknownAssessment.isAnomaly === true, 'Unregistered serial triggers isAnomaly = true');
    assert(unknownAssessment.anomalyType === 'UNKNOWN_SERIAL', 'Anomaly type is UNKNOWN_SERIAL');
    assert(unknownAssessment.riskScore >= 90, 'Risk score is >= 90 for unknown product');

    // --------------------------------------------------------------------------
    // TEST 3: Batch Recall Anomaly
    // --------------------------------------------------------------------------
    console.log('\nTest 3: Batch Recall Flagging');
    const recallAssessment = await anomalyService.analyzeScan(
        'RECALLED-SERIAL-001',
        { city: 'Delhi' },
        { exists: true, verificationStatus: 'RECALLED' }
    );
    assert(recallAssessment.isAnomaly === true, 'Recalled batch triggers isAnomaly = true');
    assert(recallAssessment.anomalyType === 'RECALLED_BATCH', 'Anomaly type is RECALLED_BATCH');
    assert(recallAssessment.riskScore === 100, 'Risk score is 100 (Maximum Severity) for recalled batch');

    // --------------------------------------------------------------------------
    // TEST 4: Expired Product Anomaly
    // --------------------------------------------------------------------------
    console.log('\nTest 4: Expired Medicine Anomaly');
    const expiredAssessment = await anomalyService.analyzeScan(
        'EXPIRED-SERIAL-002',
        { city: 'Chennai' },
        { exists: true, verificationStatus: 'EXPIRED' }
    );
    assert(expiredAssessment.isAnomaly === true, 'Expired medicine triggers isAnomaly = true');
    assert(expiredAssessment.anomalyType === 'EXPIRED_BATCH', 'Anomaly type is EXPIRED_BATCH');
    assert(expiredAssessment.riskScore === 85, 'Risk score is 85 for expired product');

    // --------------------------------------------------------------------------
    // SETUP ON-CHAIN FIXTURES
    // --------------------------------------------------------------------------
    console.log('\nSetup: Registering Chaincode Baseline Fixtures (Product, Batch, Units)...');
    await blockchainService.submitTransaction(
        'ManufacturerMSP',
        'RegisterProduct',
        '08901111222233',
        'Dolo-650',
        'Paracetamol',
        'Tablet',
        '650 mg'
    );

    await blockchainService.submitTransaction(
        'ManufacturerMSP',
        'RegisterBatch',
        'B2026-ANOM-01',
        '08901111222233',
        '2026-01-01',
        '2028-12-31',
        '5000',
        'West Bengal Formulation Facility'
    );

    // --------------------------------------------------------------------------
    // TEST 5: Authentic Single Scan (Genuine Product Baseline)
    // --------------------------------------------------------------------------
    console.log('\nTest 5: Authentic Baseline Scan');
    const testSerial = 'MED-IN-TEST-ANOMALY-001';

    await blockchainService.submitTransaction(
        'ManufacturerMSP',
        'CreateSerial',
        testSerial,
        'B2026-ANOM-01',
        'SIG-RSA-001'
    );

    const verify1 = await verificationService.verifySerial(testSerial, {
        city: 'Kolkata',
        latitude: 22.5726,
        longitude: 88.3639
    });

    assert(verify1.verificationStatus === 'AUTHENTIC', 'Initial scan returns AUTHENTIC status');
    assert(verify1.anomaly.isAnomaly === false, 'Initial scan reports isAnomaly = false');
    assert(verify1.anomaly.anomalyType === 'NONE', 'Anomaly type is NONE');
    assert(verify1.anomaly.riskScore === 0, 'Risk score is 0 for authentic first scan');
    assert(verify1.anomaly.scanCount === 1, 'Scan count recorded as 1');

    // --------------------------------------------------------------------------
    // TEST 6: Impossible Velocity Anomaly (Physical Cloning Detection)
    // --------------------------------------------------------------------------
    console.log('\nTest 6: Impossible Velocity Anomaly Detection (Cloned QR Code)');
    // Immediate second scan of the same packaging unit in Mumbai (1650 km away)
    const verify2 = await verificationService.verifySerial(testSerial, {
        city: 'Mumbai',
        latitude: 19.0760,
        longitude: 72.8777
    });

    assert(verify2.verificationStatus === 'SUSPICIOUS_VELOCITY', 'Multi-city instantaneous scan returns SUSPICIOUS_VELOCITY');
    assert(verify2.anomaly.isAnomaly === true, 'Triggers isAnomaly = true');
    assert(verify2.anomaly.anomalyType === 'SUSPICIOUS_VELOCITY', 'Anomaly type is SUSPICIOUS_VELOCITY');
    assert(verify2.anomaly.riskScore >= 95, 'Risk score is >= 95 (Extreme Threat)');
    assert(verify2.anomaly.velocityDetails !== null, 'Velocity details object populated');
    assert(verify2.anomaly.velocityDetails.distanceKm > 1600, 'Calculated distance reflects Kolkata-to-Mumbai (~1654 km)');
    assert(verify2.anomaly.velocityDetails.velocityKmh > 850, 'Effective transit velocity exceeds aviation limit (850 km/h)');
    assert(verify2.alertMessage.includes('IMPOSSIBLE VELOCITY DETECTED'), 'Alert message clearly warns consumer of cloned QR code');

    // --------------------------------------------------------------------------
    // TEST 7: Duplicate Scan on Already-Sold Medicine Pack
    // --------------------------------------------------------------------------
    console.log('\nTest 7: Rescan on Already Sold Pack (Consumer Purchase Cloned)');
    const soldSerial = 'MED-IN-SOLD-UNIT-777';
    await blockchainService.submitTransaction(
        'ManufacturerMSP',
        'CreateSerial',
        soldSerial,
        'B2026-ANOM-01',
        'SIG-RSA-777'
    );
    await blockchainService.submitTransaction(
        'ManufacturerMSP',
        'RecordSale',
        soldSerial,
        'DL-WB-2026-99',
        'RECEIPT-HASH-777'
    );

    const soldVerify = await verificationService.verifySerial(soldSerial, { city: 'Bengaluru' });
    assert(soldVerify.verificationStatus === 'ALREADY_SOLD', 'Scanned unit detected as ALREADY_SOLD');
    assert(soldVerify.anomaly.isAnomaly === true, 'Duplicate sold scan triggers isAnomaly = true');
    assert(soldVerify.anomaly.anomalyType === 'ALREADY_SOLD', 'Anomaly type is ALREADY_SOLD');
    assert(soldVerify.anomaly.riskScore === 95, 'Risk score is 95 for sold pack reuse');
    assert(soldVerify.alertMessage.includes('SUSPICIOUS DUPLICATE SCAN'), 'Consumer is warned about potential packaging reuse');

    // --------------------------------------------------------------------------
    // TEST 8: High Frequency Rapid Burst Anomaly
    // --------------------------------------------------------------------------
    console.log('\nTest 8: High Frequency Scan Burst (Bot / Scraper)');
    const burstSerial = 'MED-IN-BURST-SCAN-999';
    await blockchainService.submitTransaction(
        'ManufacturerMSP',
        'CreateSerial',
        burstSerial,
        'B2026-ANOM-01',
        'SIG-RSA-999'
    );

    // Simulate 5 scans in rapid succession at same location
    for (let i = 0; i < 5; i++) {
        await verificationService.verifySerial(burstSerial, { city: 'Delhi', ip: '192.168.1.100' });
    }
    // 6th scan within seconds
    const burstVerify = await verificationService.verifySerial(burstSerial, { city: 'Delhi', ip: '192.168.1.100' });
    assert(burstVerify.anomaly.isAnomaly === true, 'Burst scan triggers isAnomaly = true');
    assert(burstVerify.anomaly.anomalyType === 'HIGH_FREQUENCY_SCAN', 'Anomaly type is HIGH_FREQUENCY_SCAN');
    assert(burstVerify.anomaly.riskScore >= 80, 'Risk score is >= 80 for rapid burst scans');

    // --------------------------------------------------------------------------
    // TEST 9: HTTP REST API Verification Endpoint Integration
    // --------------------------------------------------------------------------
    console.log('\nTest 9: End-to-End HTTP API Endpoint Verification');
    const port = 5099;
    server = http.createServer(app);
    await new Promise(resolve => server.listen(port, resolve));
    baseUrl = `http://localhost:${port}`;

    const apiSerial = 'MED-IN-HTTP-TEST-123';
    await blockchainService.submitTransaction(
        'ManufacturerMSP',
        'CreateSerial',
        apiSerial,
        'B2026-ANOM-01',
        'SIG-RSA-123'
    );

    // First HTTP scan: Kolkata
    const res1 = await makeRequest('GET', `${config.apiPrefix}/verification/verify/${apiSerial}?city=Kolkata`);
    assert(res1.status === 200, 'HTTP GET /verification/verify returns 200');
    assert(res1.data.data.verificationStatus === 'AUTHENTIC', 'Initial HTTP scan is AUTHENTIC');
    assert(res1.data.data.anomaly.isAnomaly === false, 'Initial HTTP scan anomaly is false');

    // Second HTTP scan: Mumbai (immediately)
    const res2 = await makeRequest('GET', `${config.apiPrefix}/verification/verify/${apiSerial}?city=Mumbai`);
    assert(res2.status === 200, 'HTTP GET /verification/verify returns 200');
    assert(res2.data.data.verificationStatus === 'SUSPICIOUS_VELOCITY', 'HTTP scan immediately flags SUSPICIOUS_VELOCITY');
    assert(res2.data.data.anomaly.isAnomaly === true, 'HTTP scan flags isAnomaly = true');
    assert(res2.data.data.anomaly.riskScore >= 95, 'HTTP scan riskScore >= 95');

    // Clean up server
    await new Promise(resolve => server.close(resolve));

    console.log('\n==============================================================================');
    console.log(`🎉 ALL STAGE 11 ANOMALY TESTS PASSED: ${passedTests} / ${totalTests} checks passed (100%)`);
    console.log('==============================================================================\n');
}

runAnomalyTests().catch((err) => {
    console.error('\n❌ STAGE 11 TEST SUITE FAILED:', err);
    if (server) {
        server.close();
    }
    process.exit(1);
});
