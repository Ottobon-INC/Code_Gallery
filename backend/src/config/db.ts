/**
 * PostgreSQL connection pool.
 *
 * Uses a single `pg.Pool` instance (singleton) shared across the entire
 * application. Reads the connection string from DATABASE_URL.
 *
 * Usage:
 *   import { query } from '../config/db';
 *   const result = await query<MyRowType>('SELECT * FROM ...', [param]);
 */

import { Pool, QueryResult } from 'pg';

// Validate the required environment variable at startup — fail fast.
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    throw new Error(
        '[db] DATABASE_URL environment variable is not set. ' +
        'Copy .env.example to .env and fill in your Supabase connection string.'
    );
}

const pool = new Pool({
    connectionString,
    // Keep a healthy pool size; tune based on Supabase plan limits.
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
    // SSL is required by Supabase in production.
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: true } : false,
});

// Log pool-level errors (e.g. dropped connections).
pool.on('error', (err) => {
    console.error('[db] Unexpected pool error:', err.message);
});

/**
 * Typed wrapper around `pool.query`.
 * All SQL queries in the app must go through this helper to ensure
 * parameterized inputs (preventing SQL injection).
 *
 * @param text - Parameterized SQL string (use $1, $2, … placeholders)
 * @param params - Array of values bound to the placeholders
 */
export async function query<T extends object = Record<string, unknown>>(
    text: string,
    params?: unknown[]
): Promise<QueryResult<T>> {
    return pool.query<T>(text, params);
}

/** Expose pool directly for transactions that need a dedicated client. */
export { pool };
