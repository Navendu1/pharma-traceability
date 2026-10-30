// ==============================================================================
// AUTHENTICATION & RBAC AUTOMATED TEST SUITE
// File: backend/api/src/tests/auth.test.js
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
            path: url.pathname,
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

async function runAuthTests() {
    console.log('\n============================================================');
    console.log('🧪 RUNNING STAGE 3: EXPRESS API & AUTHENTICATION TEST SUITE');
    console.log('============================================================\n');

    let passedTests = 0;
    let totalTests = 0;

    const assert = (condition, description) => {
        totalTests++;
        if (condition) {
            console.log(`  ✅ PASS: ${description}`);
            passedTests++;
        } else {
            console.error(`  ❌ FAIL: ${description}`);
        }
    };

    // 1. Start test server on random port
    await new Promise((resolve) => {
        server = app.listen(0, '127.0.0.1', () => {
            const port = server.address().port;
            baseUrl = `http://127.0.0.1:${port}`;
            console.log(`Test server running at ${baseUrl}\n`);
            resolve();
        });
    });

    try {
        // Test 1: Health Check
        console.log('Test 1: Health Check Endpoint');
        const healthRes = await makeRequest('GET', '/health');
        assert(healthRes.status === 200, 'GET /health returns HTTP 200');
        assert(healthRes.data.success === true, 'Response contains success: true');
        assert(healthRes.data.service.includes('Pharma Traceability'), 'Service name is verified');

        // Test 2: Successful Login (Manufacturer Admin)
        console.log('\nTest 2: Successful Login (Manufacturer Admin)');
        const loginRes = await makeRequest('POST', `${config.apiPrefix}/auth/login`, {
            email: 'mfg_admin@apexbiopharma.com',
            password: 'Password@123'
        });
        assert(loginRes.status === 200, 'POST /login returns HTTP 200');
        assert(loginRes.data.success === true, 'Login response success is true');
        assert(!!loginRes.data.data.tokens.accessToken, 'Access token (JWT) is issued');
        assert(loginRes.data.data.user.role === 'ORG_ADMIN', 'User role is ORG_ADMIN');
        assert(loginRes.data.data.organization.mspId === 'ManufacturerMSP', 'Organization MSP is ManufacturerMSP');

        const validToken = loginRes.data.data.tokens.accessToken;

        // Test 3: Authenticated Profile (GET /me)
        console.log('\nTest 3: Fetch Authenticated User Profile');
        const meRes = await makeRequest('GET', `${config.apiPrefix}/auth/me`, null, validToken);
        assert(meRes.status === 200, 'GET /auth/me returns HTTP 200');
        assert(meRes.data.data.email === 'mfg_admin@apexbiopharma.com', 'Profile email matches authenticated user');
        assert(meRes.data.data.organization.name === 'Apex Biopharma Ltd.', 'Organization name is resolved correctly');

        // Test 4: Failed Login (Wrong Password)
        console.log('\nTest 4: Failed Login with Invalid Password');
        const wrongPassRes = await makeRequest('POST', `${config.apiPrefix}/auth/login`, {
            email: 'mfg_admin@apexbiopharma.com',
            password: 'WrongPassword999!'
        });
        assert(wrongPassRes.status === 401, 'Wrong password returns HTTP 401 Unauthorized');
        assert(wrongPassRes.data.error.code === 'INVALID_CREDENTIALS', 'Error code is INVALID_CREDENTIALS');

        // Test 5: Failed Login (Non-existent Email)
        console.log('\nTest 5: Failed Login with Non-Existent Email');
        const wrongEmailRes = await makeRequest('POST', `${config.apiPrefix}/auth/login`, {
            email: 'unknown_hacker@fraud.com',
            password: 'Password@123'
        });
        assert(wrongEmailRes.status === 401, 'Non-existent email returns HTTP 401 Unauthorized');

        // Test 6: Access Protected Route Without Token
        console.log('\nTest 6: Protected Route Without Token');
        const noTokenRes = await makeRequest('GET', `${config.apiPrefix}/auth/me`);
        assert(noTokenRes.status === 401, 'Missing token returns HTTP 401 Unauthorized');
        assert(noTokenRes.data.error.code === 'UNAUTHORIZED', 'Error code is UNAUTHORIZED');

        // Test 7: Access Protected Route with Forged Token
        console.log('\nTest 7: Protected Route with Forged Token');
        const forgedTokenRes = await makeRequest('GET', `${config.apiPrefix}/auth/me`, null, 'forged.invalid.token');
        assert(forgedTokenRes.status === 401, 'Forged token returns HTTP 401 Unauthorized');
        assert(forgedTokenRes.data.error.code === 'INVALID_TOKEN', 'Error code is INVALID_TOKEN');

        // Test 8: Input Validation (Malformed Email)
        console.log('\nTest 8: Request Validation on Malformed Payload');
        const badPayloadRes = await makeRequest('POST', `${config.apiPrefix}/auth/login`, {
            email: 'not-an-email',
            password: 'short'
        });
        assert(badPayloadRes.status === 400, 'Malformed payload returns HTTP 400 Bad Request');
        assert(badPayloadRes.data.error.code === 'VALIDATION_ERROR', 'Error code is VALIDATION_ERROR');

        console.log('\n============================================================');
        console.log(`TEST SUMMARY: ${passedTests} / ${totalTests} CHECKS PASSED (${Math.round((passedTests/totalTests)*100)}%)`);
        console.log('============================================================\n');

    } catch (err) {
        console.error('Test execution failure:', err);
    } finally {
        server.close();
    }
}

runAuthTests();

