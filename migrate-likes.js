require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        // 1. Create component_likes junction table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS component_likes (
                id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                component_id UUID NOT NULL REFERENCES components(id) ON DELETE CASCADE,
                user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                UNIQUE(component_id, user_id)
            );
        `);
        console.log('[Migration] Created component_likes table.');

        // 2. Reset likes column to 0 (will be derived from the junction table from now on)
        await pool.query(`UPDATE components SET likes = 0;`);
        console.log('[Migration] Reset all component likes counts to 0.');

        process.exit(0);
    } catch (err) {
        console.error('[Migration] Error:', err);
        process.exit(1);
    }
}

run();
