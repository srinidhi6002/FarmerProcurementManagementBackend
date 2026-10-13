/**
 * Neon PostgreSQL Database Connection Pool
 */
const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;

let pool = null;

if (connectionString) {
    pool = new Pool({
        connectionString,
        ssl: {
            rejectUnauthorized: false // Required for Neon cloud PostgreSQL connection
        }
    });

    pool.on('connect', () => {
        console.log('⚡ Connected to Neon Cloud PostgreSQL Database');
    });

    pool.on('error', (err) => {
        console.error('❌ Unexpected Neon DB Pool Error:', err);
    });
} else {
    console.warn('⚠️ DATABASE_URL is not configured in environment. Backend will operate in fallback mode or report mock DB state.');
}

const query = async (text, params) => {
    if (!pool) {
        throw new Error('Database pool not initialized. Please set DATABASE_URL in .env');
    }
    const start = Date.now();
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text: text.substring(0, 60), duration, rows: res.rowCount });
    return res;
};

module.exports = {
    pool,
    query
};
