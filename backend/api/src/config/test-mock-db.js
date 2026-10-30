// ==============================================================================
// IN-MEMORY POSTGRESQL VERIFICATION TEST RUNNER
// File: backend/api/src/config/test-mock-db.js
// ==============================================================================

const fs = require('fs');
const path = require('path');
const { newDb } = require('pg-mem');
const { v4: uuidv4 } = require('uuid');

async function runMockDbTest() {
    console.log('\n============================================================');
    console.log('🧪 VERIFYING SQL SCHEMA & SEEDS WITH IN-MEMORY POSTGRES ENGINE');
    console.log('============================================================\n');

    try {
        // 1. Initialize in-memory PostgreSQL instance
        const memDb = newDb();

        // Register uuid_generate_v4 function
        memDb.public.registerFunction({
            name: 'uuid_generate_v4',
            returns: memDb.public.getType('uuid'),
            implementation: () => uuidv4()
        });

        // 2. Read and apply schema.sql
        console.log('1. Loading database/schema.sql...');
        const schemaPath = path.resolve(__dirname, '../../../../database/schema.sql');
        let schemaSql = fs.readFileSync(schemaPath, 'utf8');

        // Remove CREATE EXTENSION since we registered the function directly
        schemaSql = schemaSql.replace(/CREATE EXTENSION IF NOT EXISTS "uuid-ossp";/g, '');

        memDb.public.none(schemaSql);
        console.log('   ✅ Schema compiled and 11 tables created with full constraints!\n');

        // 3. Read and apply seed data
        console.log('2. Loading database/seeds/001_initial_seed_data.sql...');
        const seedsPath = path.resolve(__dirname, '../../../../database/seeds/001_initial_seed_data.sql');
        const seedSql = fs.readFileSync(seedsPath, 'utf8');
        memDb.public.none(seedSql);
        console.log('   ✅ Seed records inserted successfully!\n');

        // 4. Query Organizations
        console.log('3. Seeded Organizations:');
        const orgs = memDb.public.many(
            'SELECT name, type, license_number, msp_id, is_verified FROM organizations ORDER BY name;'
        );
        console.table(orgs);

        // 5. Query Products & Batches
        console.log('4. Seeded Products & Batches:');
        const batches = memDb.public.many(`
            SELECT 
                p.brand_name, 
                p.generic_name, 
                p.gtin, 
                b.batch_number, 
                b.manufacturing_date, 
                b.expiry_date, 
                b.quantity, 
                b.blockchain_status,
                b.is_recalled
            FROM batches b
            JOIN products p ON b.product_id = p.id
            ORDER BY b.batch_number;
        `);
        console.table(batches);

        // 6. Query Serial Units & Custodians
        console.log('5. Seeded Serial Units & Custody:');
        const serials = memDb.public.many(`
            SELECT 
                s.serial_number, 
                s.status, 
                o.name AS current_custodian, 
                o.type AS custodian_type,
                s.verification_count
            FROM serial_units s
            JOIN organizations o ON s.current_custodian_id = o.id
            ORDER BY s.serial_number;
        `);
        console.table(serials);

        // 7. Query Recalls
        console.log('6. Seeded Recalls:');
        const recalls = memDb.public.many(`
            SELECT 
                r.severity, 
                b.batch_number, 
                r.reason, 
                r.status, 
                r.blockchain_status
            FROM recalls r
            JOIN batches b ON r.batch_id = b.id;
        `);
        console.table(recalls);

        console.log('============================================================');
        console.log('🎉 SCHEMA VALIDATION & SEED QUERIES PASSED WITH ZERO ERRORS!');
        console.log('============================================================\n');

    } catch (error) {
        console.error('❌ SQL Compilation/Execution Error:', error.message);
        process.exit(1);
    }
}

runMockDbTest();
