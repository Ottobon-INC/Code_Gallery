require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        // 1. Add name column to users
        await pool.query(`
            ALTER TABLE users
            ADD COLUMN IF NOT EXISTS name TEXT;
        `);
        console.log('[Migration] Added name column to users table.');

        // 2. Set Jaswanth's name
        const result = await pool.query(
            `UPDATE users SET name = 'Jaswanth' WHERE email = 'jaswanth@ottobon.in' RETURNING id, email, name`
        );
        if (result.rows.length > 0) {
            console.log('[Migration] Updated user:', result.rows[0]);
        } else {
            console.log('[Migration] User jaswanth@ottobon.in not found — set name manually.');
        }

        process.exit(0);
    } catch (err) {
        console.error('[Migration] Error:', err);
        process.exit(1);
    }
}

run();
