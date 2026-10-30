// ==============================================================================
// DATABASE HEALTH CHECK & SEED VERIFICATION SCRIPT
// File: backend/api/src/config/test-db.js
// ==============================================================================

const db = require('./database');

async function testDatabase() {
    console.log('\n============================================================');
    console.log('🧪 TESTING POSTGRESQL DATABASE CONNECTION & SEEDED RECORDS');
    console.log('============================================================\n');

    try {
        // 1. Health check
        console.log('1. Checking database connection...');
        const health = await db.healthCheck();

        if (health.status !== 'UP') {
            console.error('❌ Connection Failed:', health.error);
            console.log('\n💡 [Diagnosis]: PostgreSQL container is not running.');
            console.log('   Please ensure Docker Desktop is running, then execute:');
            console.log('   docker compose up -d\n');
            process.exit(1);
        }

        console.log('   ✅ PostgreSQL is CONNECTED and HEALTHY!');
        console.log(`   Database : ${health.database}`);
        console.log(`   Server Time : ${health.timestamp}`);
        console.log(`   Engine : ${health.version.split(' on ')[0]}\n`);

        // 2. Query Organizations
        console.log('2. Querying Seeded Organizations:');
        const orgs = await db.query(
            'SELECT name, type, license_number, msp_id, is_verified FROM organizations ORDER BY name;'
        );
        console.table(orgs.rows);

        // 3. Query Products & Batches (Relational Join)
        console.log('3. Querying Products & Batches:');
        const batches = await db.query(`
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
        console.table(batches.rows);

        // 4. Query Serial Units & Current Custodians
        console.log('4. Querying Serial Units & Custody Status:');
        const serials = await db.query(`
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
        console.table(serials.rows);

        // 5. Query Recalls
        console.log('5. Querying Recall Alerts:');
        const recalls = await db.query(`
            SELECT 
                r.severity, 
                b.batch_number, 
                r.reason, 
                r.status, 
                r.blockchain_status
            FROM recalls r
            JOIN batches b ON r.batch_id = b.id;
        `);
        console.table(recalls.rows);

        console.log('============================================================');
        console.log('🎉 ALL DATABASE VERIFICATION CHECKS PASSED SUCCESSFULLY!');
        console.log('============================================================\n');

    } catch (error) {
        console.error('❌ Database verification test encountered an error:', error.message);
    } finally {
        await db.close();
    }
}

testDatabase();

