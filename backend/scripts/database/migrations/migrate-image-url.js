require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function migrate() {
    console.log('[Migration] Adding image_url column to components table...');
    try {
        await pool.query('ALTER TABLE components ADD COLUMN IF NOT EXISTS image_url TEXT;');
        console.log('[Migration] ✅ Success: image_url column added (or already exists).');
        process.exit(0);
    } catch (err) {
        console.error('[Migration] ❌ Error:', err.message);
        process.exit(1);
    }
}

migrate();
