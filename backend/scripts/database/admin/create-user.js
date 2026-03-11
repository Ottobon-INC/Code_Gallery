require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function run() {
    const email = 'jaswanth@ottobon.in';
    const password = 'Ottobon';

    try {
        const hash = await bcrypt.hash(password, 10);

        // Check if user already exists
        const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
        if (existing.rows.length > 0) {
            // Update existing user to ensure approved
            await pool.query(
                'UPDATE users SET password_hash = $1, is_approved = true WHERE email = $2',
                [hash, email]
            );
            console.log(`[Setup] Updated existing user: ${email} — is_approved = TRUE`);
        } else {
            // Insert new approved user
            const result = await pool.query(
                `INSERT INTO users (email, password_hash, is_approved, is_admin)
                 VALUES ($1, $2, true, false) RETURNING id, email, is_approved`,
                [email, hash]
            );
            console.log('[Setup] Created user:', result.rows[0]);
        }

        process.exit(0);
    } catch (err) {
        console.error('[Setup] Error:', err);
        process.exit(1);
    }
}

run();
