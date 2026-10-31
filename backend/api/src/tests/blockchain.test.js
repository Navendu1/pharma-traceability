// ==============================================================================
// BLOCKCHAIN SERVICE & DUAL-WRITE AUTOMATED TEST SUITE
// File: backend/api/src/tests/blockchain.test.js
// ==============================================================================

const blockchainService = require('../services/blockchain.service');

async function runBlockchainTests() {
    console.log('\n============================================================');
    console.log('🧪 RUNNING STAGE 6: BLOCKCHAIN SERVICE & DUAL-WRITE TESTS');
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

    try {
        // Test 1: Register Product on Blockchain
        console.log('Test 1: Submit RegisterProduct on Blockchain');
        const prodRes = await blockchainService.submitTransaction(
            'ManufacturerMSP',
            'RegisterProduct',
            '08901234567890',
            'Paracip-500',
            'Paracetamol IP',
            'Tablet',
            '500 mg'
        );
        assert(prodRes.status === 'COMMITTED', 'Product transaction committed successfully');
        assert(prodRes.txId.startsWith('0x'), 'Transaction ID (txId) is generated');
        assert(prodRes.result.gtin === '08901234567890', 'On-chain product GTIN is verified');

        // Test 2: Reject Unauthorized RegisterProduct
        console.log('\nTest 2: Reject Unauthorized RegisterProduct from DistributorMSP');
        try {
            await blockchainService.submitTransaction(
                'DistributorMSP',
                'RegisterProduct',
                '08909999999999',
                'Fake-Drug',
                'Unknown',
                'Tablet',
                '100 mg'
            );
            assert(false, 'Should have thrown unauthorized error');
        } catch (err) {
            assert(err.message.includes('Unauthorized'), 'Distributor correctly rejected from registering product');
        }

        // Test 3: Register Batch on Blockchain
        console.log('\nTest 3: Submit RegisterBatch on Blockchain');
        const batchRes = await blockchainService.submitTransaction(
            'ManufacturerMSP',
            'RegisterBatch',
            'B2026-001',
            '08901234567890',
            '2026-08-01',
            '2028-07-31',
            '1000',
            'canonical_hash_proof_123'
        );
        assert(batchRes.status === 'COMMITTED', 'Batch committed to blockchain ledger');
        assert(batchRes.result.batchNumber === 'B2026-001', 'Batch number matches');

        // Test 4: Unit Serialization on Blockchain
        console.log('\nTest 4: Submit CreateSerial on Blockchain');
        const serialRes = await blockchainService.submitTransaction(
            'ManufacturerMSP',
            'CreateSerial',
            'MED-IN-7K4P-92XF-8Q2M',
            'B2026-001',
            'digital_sig_ed25519_test'
        );
        assert(serialRes.status === 'COMMITTED', 'Serial unit registered on blockchain');
        assert(serialRes.result.status === 'CREATED', 'Initial unit status is CREATED');

        // Test 5: Dispatch & Inward Receipt Lifecycle
        console.log('\nTest 5: Shipment Dispatch & Receipt (Org1 -> Org2)');
        const dispatchRes = await blockchainService.submitTransaction(
            'ManufacturerMSP',
            'DispatchShipment',
            'SHIP-2026-001',
            'DistributorMSP',
            JSON.stringify(['MED-IN-7K4P-92XF-8Q2M'])
        );
        assert(dispatchRes.result.status === 'DISPATCHED', 'Shipment dispatched');

        const receiptRes = await blockchainService.submitTransaction(
            'DistributorMSP',
            'ReceiveShipment',
            'SHIP-2026-001'
        );
        assert(receiptRes.result.status === 'DELIVERED', 'Shipment inward receipt confirmed');

        // Test 6: Query / Evaluate VerifyProduct
        console.log('\nTest 6: Evaluate Query VerifyProduct');
        const queryRes = await blockchainService.evaluateTransaction(
            'DistributorMSP',
            'VerifyProduct',
            'MED-IN-7K4P-92XF-8Q2M'
        );
        assert(queryRes.exists === true, 'Product exists on ledger');
        assert(queryRes.currentCustodian === 'DistributorMSP', 'Current custodian updated to DistributorMSP');
        assert(queryRes.verificationStatus === 'AUTHENTIC', 'Verification status is AUTHENTIC');

        // Test 7: Dual-Write Coordination Engine Test
        console.log('\nTest 7: Dual-Write Database & Blockchain Coordination');
        let dbState = 'NOT_STARTED';
        let recordedTxId = null;

        const coordinatedResult = await blockchainService.executeCoordinatedTransaction({
            callerMspId: 'DistributorMSP',
            chaincodeFunction: 'TransferCustody',
            chaincodeArgs: ['MED-IN-7K4P-92XF-8Q2M', 'PharmacyMSP', 'Transferred to retail pharmacy'],
            onPreDatabaseWrite: async () => {
                dbState = 'PENDING_BLOCKCHAIN';
                return { recordId: '101', entity: 'SERIAL_UNIT' };
            },
            onPostDatabaseSuccess: async (record, txId) => {
                dbState = 'COMMITTED';
                recordedTxId = txId;
            },
            onDatabaseFailure: async (record, error) => {
                dbState = 'FAILED';
            }
        });

        assert(coordinatedResult.status === 'COMMITTED', 'Coordinated transaction committed');
        assert(dbState === 'COMMITTED', 'Database transitioned from PENDING to COMMITTED');
        assert(!!recordedTxId, 'Database saved immutable blockchain txId');

        // Test 8: Dual-Write Failure Handling
        console.log('\nTest 8: Dual-Write Abort on Blockchain Rejection');
        let failureDbState = 'NOT_STARTED';

        try {
            await blockchainService.executeCoordinatedTransaction({
                callerMspId: 'ManufacturerMSP', // Manufacturer is no longer custodian!
                chaincodeFunction: 'TransferCustody',
                chaincodeArgs: ['MED-IN-7K4P-92XF-8Q2M', 'WholesalerMSP', 'Illegal transfer'],
                onPreDatabaseWrite: async () => {
                    failureDbState = 'PENDING_BLOCKCHAIN';
                    return { recordId: '102' };
                },
                onPostDatabaseSuccess: async () => {
                    failureDbState = 'COMMITTED';
                },
                onDatabaseFailure: async () => {
                    failureDbState = 'FAILED';
                }
            });
            assert(false, 'Should have failed unauthorized transfer');
        } catch (err) {
            assert(failureDbState === 'FAILED', 'Database state correctly flagged as FAILED when blockchain aborts');
        }

        console.log('\n============================================================');
        console.log(`TEST SUMMARY: ${passedTests} / ${totalTests} CHECKS PASSED (${Math.round((passedTests/totalTests)*100)}%)`);
        console.log('============================================================\n');

    } catch (err) {
        console.error('Test execution failed:', err);
    }
}

runBlockchainTests();

