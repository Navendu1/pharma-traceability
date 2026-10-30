// ==============================================================================
// POSTGRESQL DATABASE CONNECTION POOL
// File: backend/api/src/config/database.js
// ==============================================================================

const { Pool } = require('pg');
const config = require('./environment');

// Initialize the PostgreSQL connection pool
const pool = new Pool({
    host: config.db.host,
    port: config.db.port,
    database: config.db.database,
    user: config.db.user,
    password: config.db.password,
    min: config.db.min,
    max: config.db.max,
    idleTimeoutMillis: 30000,          // Close idle clients after 30 seconds
    connectionTimeoutMillis: 5000,      // Return error after 5s if connection cannot be established
    ssl: config.db.ssl ? { rejectUnauthorized: false } : false
});

// Event listener: On client connection
pool.on('connect', (client) => {
    // Session level configuration can be injected here
});

// Event listener: Unexpected idle client errors
pool.on('error', (err, client) => {
    console.error('❌ [Database Pool Error]: Unexpected error on idle PostgreSQL client:', err.message);
});

/**
 * Execute a parameterized SQL query
 * @param {string} text - SQL statement with $1, $2 parameter placeholders
 * @param {Array} params - Array of parameter values
 * @returns {Promise<object>} pg QueryResult
 */
const query = async (text, params) => {
    const start = Date.now();
    try {
        const res = await pool.query(text, params);
        const duration = Date.now() - start;
        if (config.env === 'development') {
            // console.log(`[SQL Query] Executed in ${duration}ms | Rows: ${res.rowCount}`);
        }
        return res;
    } catch (error) {
        console.error('❌ [Database Query Error]:', {
            text,
            params,
            message: error.message
        });
        throw error;
    }
};

/**
 * Acquire a dedicated client from the pool (Required for SQL Transactions)
 * Example usage:
 *   const client = await getClient();
 *   try {
 *     await client.query('BEGIN');
 *     ...
 *     await client.query('COMMIT');
 *   } catch(e) {
 *     await client.query('ROLLBACK');
 *   } finally {
 *     client.release();
 *   }
 */
const getClient = async () => {
    const client = await pool.connect();
    return client;
};

/**
 * Check database connectivity and version
 * @returns {Promise<object>} Status, current database timestamp, and engine version
 */
const healthCheck = async () => {
    try {
        const result = await pool.query('SELECT NOW() as db_time, version() as db_version, current_database() as db_name;');
        return {
            status: 'UP',
            database: result.rows[0].db_name,
            timestamp: result.rows[0].db_time,
            version: result.rows[0].db_version
        };
    } catch (error) {
        return {
            status: 'DOWN',
            error: error.message
        };
    }
};

/**
 * Gracefully close all pool connections
 */
const close = async () => {
    await pool.end();
};

module.exports = {
    pool,
    query,
    getClient,
    healthCheck,
    close
};
