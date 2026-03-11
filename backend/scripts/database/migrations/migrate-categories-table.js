require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        // 1. Create categories table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS categories (
                id    TEXT PRIMARY KEY,
                label TEXT NOT NULL,
                icon  TEXT NOT NULL DEFAULT '◈',
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
        `);
        console.log('[Migration] Created categories table.');

        // 2. Seed with existing categories (skip if already present)
        const seed = [
            { id: 'forms', label: 'Forms', icon: '▣' },
            { id: 'navigation', label: 'Navigation', icon: '▷' },
            { id: 'data-display', label: 'Data Display', icon: '▤' },
            { id: 'overlays', label: 'Overlays', icon: '◫' },
            { id: 'feedback', label: 'Feedback', icon: '◌' },
        ];

        for (const c of seed) {
            await pool.query(
                `INSERT INTO categories (id, label, icon) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING`,
                [c.id, c.label, c.icon]
            );
        }
        console.log('[Migration] Seeded default categories.');

        process.exit(0);
    } catch (err) {
        console.error('[Migration] Error:', err);
        process.exit(1);
    }
}

run();
