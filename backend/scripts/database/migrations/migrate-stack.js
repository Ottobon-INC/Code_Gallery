require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        await pool.query(`
            ALTER TABLE components
            ADD COLUMN IF NOT EXISTS stack TEXT NOT NULL DEFAULT 'vite-react-ts';
        `);
        console.log('[Migration] Added stack column to components table.');
        process.exit(0);
    } catch (err) {
        console.error('[Migration] Error:', err);
        process.exit(1);
    }
}
run();
