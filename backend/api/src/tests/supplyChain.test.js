// ==============================================================================
// STAGE 7: END-TO-END SUPPLY CHAIN REST API INTEGRATION TESTS
// File: backend/api/src/tests/supplyChain.test.js
// ==============================================================================

const http = require('http');
const app = require('../app');
const config = require('../config/environment');

let server;
let baseUrl;

function makeRequest(method, path, body = null, token = null) {
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

        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }

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

async function runSupplyChainTests() {
    console.log('\n============================================================');
    console.log('🧪 RUNNING STAGE 7: SUPPLY CHAIN OPERATIONS E2E TEST SUITE');
    console.log('============================================================\n');

    let totalTests = 0;
    let passedTests = 0;

    const assert = (condition, description) => {
        totalTests++;
        if (condition) {
            console.log(`  ✅ PASS: ${description}`);
            passedTests++;
        } else {
            console.error(`  ❌ FAIL: ${description}`);
        }
    };

    // 1. Launch HTTP server on free ephemeral port
    await new Promise((resolve) => {
        server = app.listen(0, '127.0.0.1', () => {
            const port = server.address().port;
            baseUrl = `http://127.0.0.1:${port}`;
            console.log(`Test server running at ${baseUrl}\n`);
            resolve();
        });
    });

    try {
        // Step 1: Login Manufacturer & Distributor
        console.log('Step 1: Authenticate Stakeholders');
        const mfgAuth = await makeRequest('POST', `${config.apiPrefix}/auth/login`, {
            email: 'mfg_admin@apexbiopharma.com',
            password: 'Password@123'
        });
        const mfgToken = mfgAuth.data.data.tokens.accessToken;
        assert(!!mfgToken, 'Manufacturer logged in and received JWT');

        const distAuth = await makeRequest('POST', `${config.apiPrefix}/auth/login`, {
            email: 'dist_admin@easternmed.com',
            password: 'Password@123'
        });
        const distToken = distAuth.data.data.tokens.accessToken;
        const distOrgId = distAuth.data.data.organization.id;
        assert(!!distToken, 'Distributor logged in and received JWT');

        // Step 2: Register Product Catalog (POST /products)
        console.log('\nStep 2: Register Product Catalog on Blockchain & Database');
        const prodRes = await makeRequest('POST', `${config.apiPrefix}/products`, {
            gtin: '08901234567801',
            brandName: 'Paracip-650 Extra',
            genericName: 'Paracetamol IP',
            dosageForm: 'Tablet',
            strength: '650 mg',
            storageConditions: 'Store below 25°C',
            description: 'High-strength antipyretic formulation'
        }, mfgToken);

        assert(prodRes.status === 201, 'POST /products returns HTTP 201 Created');
        assert(prodRes.data.data.gtin === '08901234567801', 'Product GTIN matches');
        assert(prodRes.data.data.blockchainStatus === 'COMMITTED', 'Product status is COMMITTED');

        // Step 3: RBAC Rejection (Distributor cannot register product)
        console.log('\nStep 3: RBAC Check: Distributor cannot register product');
        const illegalProdRes = await makeRequest('POST', `${config.apiPrefix}/products`, {
            gtin: '08909999999999',
            brandName: 'Fake Drug',
            genericName: 'Unknown',
            dosageForm: 'Syrup',
            strength: '100mg'
        }, distToken);

        assert(illegalProdRes.status === 403, 'Distributor rejected with HTTP 403 Forbidden');
        assert(illegalProdRes.data.error.code === 'FORBIDDEN_ORGANIZATION_TYPE', 'Correct error code returned');

        // Step 4: Register Production Batch (POST /products/batches)
        console.log('\nStep 4: Register Production Batch with Canonical Proof Hash');
        const batchRes = await makeRequest('POST', `${config.apiPrefix}/products/batches`, {
            gtin: '08901234567801',
            batchNumber: 'B2026-STG7',
            manufacturingDate: '2026-09-01',
            expiryDate: '2028-08-31',
            quantity: 500
        }, mfgToken);

        assert(batchRes.status === 201, 'POST /products/batches returns HTTP 201 Created');
        assert(batchRes.data.data.batchNumber === 'B2026-STG7', 'Batch number matches');
        assert(batchRes.data.data.proofHash.length === 64, 'Deterministic SHA-256 proof hash generated');

        // Step 5: Unit Serialization (POST /products/serials/generate)
        console.log('\nStep 5: Generate Cryptographically Serialized Units');
        const serialGenRes = await makeRequest('POST', `${config.apiPrefix}/products/serials/generate`, {
            batchNumber: 'B2026-STG7',
            count: 2
        }, mfgToken);

        assert(serialGenRes.status === 201, 'POST /serials/generate returns HTTP 201 Created');
        assert(serialGenRes.data.data.totalGenerated === 2, '2 serial units generated');

        const unit1Serial = serialGenRes.data.data.serials[0].serialNumber;
        const unit2Serial = serialGenRes.data.data.serials[1].serialNumber;
        assert(unit1Serial.startsWith('MED-IN-'), 'Serial follows GS1-compliant format');

        // Step 6: Dispatch Shipment to Distributor (POST /shipments/dispatch)
        console.log('\nStep 6: Dispatch Shipment to Distributor');
        const dispatchRes = await makeRequest('POST', `${config.apiPrefix}/shipments/dispatch`, {
            shipmentCode: 'WAYBILL-WB-OD-001',
            receiverOrgId: distOrgId,
            receiverMspId: 'DistributorMSP',
            serialNumbers: [unit1Serial, unit2Serial],
            notes: 'Cold-chain shipment under monitoring'
        }, mfgToken);

        assert(dispatchRes.status === 201, 'POST /shipments/dispatch returns HTTP 201 Created');
        assert(dispatchRes.data.data.status === 'DISPATCHED', 'Shipment status is DISPATCHED');

        // Step 7: Inward Receipt Acceptance by Distributor (POST /shipments/receive)
        console.log('\nStep 7: Inward Receipt Acceptance by Distributor');
        const receiveRes = await makeRequest('POST', `${config.apiPrefix}/shipments/receive`, {
            shipmentCode: 'WAYBILL-WB-OD-001'
        }, distToken);

        assert(receiveRes.status === 200, 'POST /shipments/receive returns HTTP 200 OK');
        assert(receiveRes.data.data.status === 'DELIVERED', 'Shipment status is DELIVERED');

        // Step 8: Public Consumer Verification (GET /verification/verify/:serialNumber)
        console.log('\nStep 8: Public Consumer Verification Check');
        const verifyRes = await makeRequest('GET', `${config.apiPrefix}/verification/verify/${unit1Serial}`);
        assert(verifyRes.status === 200, 'GET /verification/verify returns HTTP 200');
        assert(verifyRes.data.data.verificationStatus === 'AUTHENTIC', 'Product verified as AUTHENTIC');
        assert(verifyRes.data.data.details.currentCustodian === 'DistributorMSP', 'Current custodian verified on-chain as DistributorMSP');

        // Step 9: Initiate Batch Recall (POST /recalls)
        console.log('\nStep 9: Initiate Batch Recall Alert');
        const recallRes = await makeRequest('POST', `${config.apiPrefix}/recalls`, {
            batchNumber: 'B2026-STG7',
            reason: 'Particle contamination reported during secondary stability inspection',
            severity: 'CLASS_I_CRITICAL'
        }, mfgToken);

        assert(recallRes.status === 201, 'POST /recalls returns HTTP 201 Created');
        assert(recallRes.data.data.severity === 'CLASS_I_CRITICAL', 'Recall severity is CLASS_I_CRITICAL');

        // Step 10: Consumer Re-Verification After Recall
        console.log('\nStep 10: Consumer Scanning Recalled Product (Anomaly Alert)');
        const recallVerifyRes = await makeRequest('GET', `${config.apiPrefix}/verification/verify/${unit1Serial}`);
        assert(recallVerifyRes.status === 200, 'Verification check returns HTTP 200');
        assert(recallVerifyRes.data.data.verificationStatus === 'RECALLED', 'Product status immediately detected as RECALLED');
        assert(recallVerifyRes.data.data.alertMessage.includes('CRITICAL RECALL ALERT'), 'Critical recall warning message returned to consumer');

        // Step 11: On-Chain Chronological Journey Audit (GET /verification/history/:serialNumber)
        console.log('\nStep 11: Fetch Immutable On-Chain Journey');
        const historyRes = await makeRequest('GET', `${config.apiPrefix}/verification/history/${unit1Serial}`);
        assert(historyRes.status === 200, 'GET /verification/history returns HTTP 200');
        assert(Array.isArray(historyRes.data.data), 'Ledger history is returned as an array');

        console.log('\n============================================================');
        console.log(`TEST SUMMARY: ${passedTests} / ${totalTests} CHECKS PASSED (${Math.round((passedTests/totalTests)*100)}%)`);
        console.log('============================================================\n');

    } catch (err) {
        console.error('Test failed with error:', err);
    } finally {
        server.close();
    }
}

runSupplyChainTests();
