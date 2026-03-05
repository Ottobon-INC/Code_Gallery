require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        // Add category column if not exists
        await pool.query(`
            ALTER TABLE components
            ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'uncategorized';
        `);
        console.log('[Migration] Added category column to components table.');
        process.exit(0);
    } catch (err) {
        console.error('[Migration] Error:', err);
        process.exit(1);
    }
}

run();
