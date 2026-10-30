// ==============================================================================
// SMART CONTRACT UNIT TEST SUITE (MOCK STUB)
// File: blockchain/chaincode/pharma-contract/test/pharmaContract.test.js
// ==============================================================================

const chai = require('chai');
const expect = chai.expect;
const PharmaContract = require('../lib/pharmaContract');

// High-fidelity Hyperledger Fabric Chaincode Mock Context
class MockStub {
    constructor() {
        this.state = new Map();
        this.history = new Map();
        this.events = new Map();
        this.txId = 'mock_tx_001_abc123';
        this.timestamp = {
            seconds: { low: Math.floor(Date.now() / 1000) },
            nanos: 0
        };
    }

    async putState(key, value) {
        this.state.set(key, Buffer.from(value));

        if (!this.history.has(key)) {
            this.history.set(key, []);
        }
        this.history.get(key).push({
            txId: this.txId,
            timestamp: this.timestamp,
            isDelete: false,
            value: Buffer.from(value)
        });
    }

    async getState(key) {
        return this.state.get(key) || Buffer.from('');
    }

    async getHistoryForKey(key) {
        const records = this.history.get(key) || [];
        let index = 0;
        return {
            next: async () => {
                if (index < records.length) {
                    return { value: records[index++], done: false };
                }
                return { value: null, done: true };
            },
            close: async () => {}
        };
    }

    setEvent(name, payload) {
        this.events.set(name, Buffer.from(payload));
    }

    getTxID() {
        return this.txId;
    }

    getTxTimestamp() {
        return this.timestamp;
    }
}

class MockClientIdentity {
    constructor(mspId) {
        this.mspId = mspId;
    }

    getMSPID() {
        return this.mspId;
    }

    getID() {
        return `x509::/CN=${this.mspId}User::/O=${this.mspId}`;
    }
}

class MockContext {
    constructor(mspId = 'ManufacturerMSP') {
        this.stub = new MockStub();
        this.clientIdentity = new MockClientIdentity(mspId);
    }

    setCallerMSP(mspId) {
        this.clientIdentity = new MockClientIdentity(mspId);
    }
}

describe('🧪 Hyperledger Fabric Smart Contract (PharmaContract) Tests', () => {
    let contract;
    let ctx;

    beforeEach(() => {
        contract = new PharmaContract();
        ctx = new MockContext('ManufacturerMSP');
    });

    // --------------------------------------------------------------------------
    // 1. Product Registration Tests
    // --------------------------------------------------------------------------
    describe('1. RegisterProduct', () => {
        it('should allow ManufacturerMSP to register a new product', async () => {
            const resultStr = await contract.RegisterProduct(
                ctx,
                '08901234567890',
                'Paracip-500',
                'Paracetamol IP',
                'Tablet',
                '500 mg'
            );
            const product = JSON.parse(resultStr);

            expect(product.gtin).to.equal('08901234567890');
            expect(product.brandName).to.equal('Paracip-500');
            expect(product.manufacturerMspId).to.equal('ManufacturerMSP');
            expect(ctx.stub.events.has('ProductRegistered')).to.be.true;
        });

        it('should REJECT product registration from unauthorized MSP (DistributorMSP)', async () => {
            ctx.setCallerMSP('DistributorMSP');
            try {
                await contract.RegisterProduct(
                    ctx,
                    '08901234567890',
                    'Paracip-500',
                    'Paracetamol IP',
                    'Tablet',
                    '500 mg'
                );
                expect.fail('Should have thrown unauthorized error');
            } catch (err) {
                expect(err.message).to.include('Unauthorized');
            }
        });

        it('should REJECT duplicate product registration with the same GTIN', async () => {
            await contract.RegisterProduct(ctx, '08901234567890', 'Paracip-500', 'Paracetamol IP', 'Tablet', '500 mg');
            try {
                await contract.RegisterProduct(ctx, '08901234567890', 'Paracip-Duplicate', 'Paracetamol IP', 'Tablet', '500 mg');
                expect.fail('Should have thrown duplicate error');
            } catch (err) {
                expect(err.message).to.include('Conflict');
            }
        });
    });

    // --------------------------------------------------------------------------
    // 2. Batch Registration Tests
    // --------------------------------------------------------------------------
    describe('2. RegisterBatch', () => {
        beforeEach(async () => {
            await contract.RegisterProduct(ctx, '08901234567890', 'Paracip-500', 'Paracetamol IP', 'Tablet', '500 mg');
        });

        it('should register a valid production batch', async () => {
            const batchStr = await contract.RegisterBatch(
                ctx,
                'B2026-001',
                '08901234567890',
                '2026-08-01',
                '2028-07-31',
                1000,
                'hash_proof_abc123'
            );
            const batch = JSON.parse(batchStr);

            expect(batch.batchNumber).to.equal('B2026-001');
            expect(batch.quantity).to.equal(1000);
            expect(batch.isRecalled).to.be.false;
            expect(ctx.stub.events.has('BatchRegistered')).to.be.true;
        });

        it('should REJECT batch when expiry date is earlier than manufacturing date', async () => {
            try {
                await contract.RegisterBatch(
                    ctx,
                    'B2026-INVALID',
                    '08901234567890',
                    '2026-08-01',
                    '2025-08-01', // Invalid: prior to mfg
                    500,
                    'hash_proof_invalid'
                );
                expect.fail('Should have thrown date validation error');
            } catch (err) {
                expect(err.message).to.include('Validation Error');
            }
        });

        it('should REJECT batch for non-existent product GTIN', async () => {
            try {
                await contract.RegisterBatch(
                    ctx,
                    'B2026-GHOST',
                    '99999999999999',
                    '2026-08-01',
                    '2028-08-01',
                    500,
                    'hash_proof'
                );
                expect.fail('Should have thrown not found error');
            } catch (err) {
                expect(err.message).to.include('Not Found');
            }
        });
    });

    // --------------------------------------------------------------------------
    // 3. Serialization Tests
    // --------------------------------------------------------------------------
    describe('3. CreateSerial', () => {
        beforeEach(async () => {
            await contract.RegisterProduct(ctx, '08901234567890', 'Paracip-500', 'Paracetamol IP', 'Tablet', '500 mg');
            await contract.RegisterBatch(ctx, 'B2026-001', '08901234567890', '2026-08-01', '2028-07-31', 1000, 'hash_proof');
        });

        it('should create a valid serial unit with initial manufacturer custody', async () => {
            const serialStr = await contract.CreateSerial(
                ctx,
                'MED-IN-7K4P-92XF-8Q2M',
                'B2026-001',
                'crypto_signature_sig123'
            );
            const unit = JSON.parse(serialStr);

            expect(unit.serialNumber).to.equal('MED-IN-7K4P-92XF-8Q2M');
            expect(unit.status).to.equal('CREATED');
            expect(unit.currentCustodian).to.equal('ManufacturerMSP');
            expect(unit.custodyHistory).to.have.lengthOf(1);
        });

        it('should REJECT duplicate serial numbers', async () => {
            await contract.CreateSerial(ctx, 'MED-IN-7K4P-92XF-8Q2M', 'B2026-001', 'sig1');
            try {
                await contract.CreateSerial(ctx, 'MED-IN-7K4P-92XF-8Q2M', 'B2026-001', 'sig2');
                expect.fail('Should have thrown duplicate serial error');
            } catch (err) {
                expect(err.message).to.include('Conflict');
            }
        });
    });

    // --------------------------------------------------------------------------
    // 4. Shipment & Inward Acceptance Tests (Org1 -> Org2)
    // --------------------------------------------------------------------------
    describe('4. Shipment Lifecycle (Dispatch & Receipt)', () => {
        beforeEach(async () => {
            await contract.RegisterProduct(ctx, '08901234567890', 'Paracip-500', 'Paracetamol IP', 'Tablet', '500 mg');
            await contract.RegisterBatch(ctx, 'B2026-001', '08901234567890', '2026-08-01', '2028-07-31', 1000, 'hash');
            await contract.CreateSerial(ctx, 'MED-IN-UNIT-001', 'B2026-001', 'sig1');
            await contract.CreateSerial(ctx, 'MED-IN-UNIT-002', 'B2026-001', 'sig2');
        });

        it('should allow current custodian (ManufacturerMSP) to dispatch shipment', async () => {
            const shipmentStr = await contract.DispatchShipment(
                ctx,
                'SHIP-2026-001',
                'DistributorMSP',
                JSON.stringify(['MED-IN-UNIT-001', 'MED-IN-UNIT-002'])
            );
            const shipment = JSON.parse(shipmentStr);

            expect(shipment.shipmentCode).to.equal('SHIP-2026-001');
            expect(shipment.status).to.equal('DISPATCHED');
            expect(shipment.receiverMspId).to.equal('DistributorMSP');

            // Verify units transitioned to IN_TRANSIT
            const verify1 = JSON.parse(await contract.VerifyProduct(ctx, 'MED-IN-UNIT-001'));
            expect(verify1.status).to.equal('IN_TRANSIT');
        });

        it('should REJECT dispatch if caller is not the owner of all units', async () => {
            ctx.setCallerMSP('DistributorMSP'); // Distributor does not own the units yet!
            try {
                await contract.DispatchShipment(
                    ctx,
                    'SHIP-ILLEGAL',
                    'PharmacyMSP',
                    JSON.stringify(['MED-IN-UNIT-001'])
                );
                expect.fail('Should have rejected unauthorized dispatch');
            } catch (err) {
                expect(err.message).to.include('Unauthorized');
            }
        });

        it('should allow designated receiver (DistributorMSP) to confirm inward receipt', async () => {
            await contract.DispatchShipment(
                ctx,
                'SHIP-2026-001',
                'DistributorMSP',
                JSON.stringify(['MED-IN-UNIT-001', 'MED-IN-UNIT-002'])
            );

            // Switch identity to DistributorMSP
            ctx.setCallerMSP('DistributorMSP');
            const receiptStr = await contract.ReceiveShipment(ctx, 'SHIP-2026-001');
            const receivedShipment = JSON.parse(receiptStr);

            expect(receivedShipment.status).to.equal('DELIVERED');

            // Verify custody transferred to DistributorMSP
            const verify1 = JSON.parse(await contract.VerifyProduct(ctx, 'MED-IN-UNIT-001'));
            expect(verify1.currentCustodian).to.equal('DistributorMSP');
            expect(verify1.status).to.equal('STOCKED');
            expect(verify1.custodyHistory).to.have.lengthOf(3); // CREATED -> DISPATCHED -> RECEIVED
        });

        it('should REJECT receipt if an unauthorized party attempts to claim shipment', async () => {
            await contract.DispatchShipment(ctx, 'SHIP-2026-001', 'DistributorMSP', JSON.stringify(['MED-IN-UNIT-001']));

            // Wrong party (PharmacyMSP) attempts to intercept
            ctx.setCallerMSP('PharmacyMSP');
            try {
                await contract.ReceiveShipment(ctx, 'SHIP-2026-001');
                expect.fail('Should have rejected wrong receiver');
            } catch (err) {
                expect(err.message).to.include('Unauthorized');
            }
        });
    });

    // --------------------------------------------------------------------------
    // 5. Custody Handover & Retail Dispensing Tests
    // --------------------------------------------------------------------------
    describe('5. Retail Sale & Anti-Duplicate Dispensing', () => {
        beforeEach(async () => {
            await contract.RegisterProduct(ctx, '08901234567890', 'Paracip-500', 'Paracetamol IP', 'Tablet', '500 mg');
            await contract.RegisterBatch(ctx, 'B2026-001', '08901234567890', '2026-08-01', '2028-07-31', 1000, 'hash');
            await contract.CreateSerial(ctx, 'MED-IN-SALE-01', 'B2026-001', 'sig');

            // Dispatch & Receive to Pharmacy
            await contract.DispatchShipment(ctx, 'SHIP-TO-PHARM', 'PharmacyMSP', JSON.stringify(['MED-IN-SALE-01']));
            ctx.setCallerMSP('PharmacyMSP');
            await contract.ReceiveShipment(ctx, 'SHIP-TO-PHARM');
        });

        it('should record retail sale and transition status to SOLD', async () => {
            const saleStr = await contract.RecordSale(
                ctx,
                'MED-IN-SALE-01',
                'DL-WB-2024-RET-0912',
                'receipt_hash_987xyz'
            );
            const soldUnit = JSON.parse(saleStr);

            expect(soldUnit.status).to.equal('SOLD');
            expect(soldUnit.soldAt).to.not.be.null;

            const verify = JSON.parse(await contract.VerifyProduct(ctx, 'MED-IN-SALE-01'));
            expect(verify.verificationStatus).to.equal('ALREADY_SOLD');
        });

        it('should REJECT double-sale attempt (cloned QR code defense)', async () => {
            await contract.RecordSale(ctx, 'MED-IN-SALE-01', 'DL-WB-2024-RET-0912', 'receipt1');

            // Counterfeiter brings cloned box attempting to sell again
            try {
                await contract.RecordSale(ctx, 'MED-IN-SALE-01', 'DL-WB-2024-RET-0912', 'receipt2');
                expect.fail('Should have rejected already sold unit');
            } catch (err) {
                expect(err.message).to.include('ALREADY SOLD');
            }
        });
    });

    // --------------------------------------------------------------------------
    // 6. Batch Recall Tests
    // --------------------------------------------------------------------------
    describe('6. Batch Recall Management', () => {
        beforeEach(async () => {
            await contract.RegisterProduct(ctx, '08901234567890', 'Paracip-500', 'Paracetamol IP', 'Tablet', '500 mg');
            await contract.RegisterBatch(ctx, 'B2026-DEFECT', '08901234567890', '2026-08-01', '2028-07-31', 1000, 'hash');
            await contract.CreateSerial(ctx, 'MED-IN-RECALL-01', 'B2026-DEFECT', 'sig');
        });

        it('should allow originating manufacturer to recall batch', async () => {
            const recallRes = await contract.RecallBatch(
                ctx,
                'B2026-DEFECT',
                'Contamination detected in laboratory retention sample',
                'CLASS_I_CRITICAL'
            );
            const { batch, recall } = JSON.parse(recallRes);

            expect(batch.isRecalled).to.be.true;
            expect(recall.severity).to.equal('CLASS_I_CRITICAL');

            // Verifying serial should now report RECALLED
            const verify = JSON.parse(await contract.VerifyProduct(ctx, 'MED-IN-RECALL-01'));
            expect(verify.verificationStatus).to.equal('RECALLED');
            expect(verify.batch.isRecalled).to.be.true;
        });

        it('should REJECT unauthorized recall from a non-originating distributor', async () => {
            ctx.setCallerMSP('DistributorMSP');
            try {
                await contract.RecallBatch(ctx, 'B2026-DEFECT', 'Malicious recall', 'CLASS_I_CRITICAL');
                expect.fail('Should have rejected unauthorized recall');
            } catch (err) {
                expect(err.message).to.include('Unauthorized');
            }
        });
    });

    // --------------------------------------------------------------------------
    // 7. Product History Traceability Tests
    // --------------------------------------------------------------------------
    describe('7. GetProductHistory', () => {
        it('should return chronological history of ledger transactions', async () => {
            await contract.RegisterProduct(ctx, '08901234567890', 'Paracip-500', 'Paracetamol IP', 'Tablet', '500 mg');
            await contract.RegisterBatch(ctx, 'B2026-001', '08901234567890', '2026-08-01', '2028-07-31', 1000, 'hash');
            await contract.CreateSerial(ctx, 'MED-IN-HIST-01', 'B2026-001', 'sig');

            const historyStr = await contract.GetProductHistory(ctx, 'MED-IN-HIST-01');
            const history = JSON.parse(historyStr);

            expect(history).to.be.an('array');
            expect(history).to.have.lengthOf(1);
            expect(history[0].value.serialNumber).to.equal('MED-IN-HIST-01');
        });
    });
});
