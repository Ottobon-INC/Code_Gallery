require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const DUMMY_UUID = '4fa42167-5846-40c4-b4a0-09a30a174ab5'; // Matches the Admin user we just created

const SEED_DATA = [
    {
        title: "Auth Login Block",
        description: "A premium authentication form with magic link and social providers.",
        raw_code: "export const AuthBlock = () => { return <div className='p-4 border border-white/10 rounded-md bg-hub-bg text-hub-text'><h1>Sign In</h1><input type='email'/><button>Submit</button></div> };",
        embedding: new Array(1536).fill(0).map(() => Math.random() * 0.1 - 0.05) // Mock vector for speed
    },
    {
        title: "Date Range Picker",
        description: "Accessible date picker with preset ranges perfectly suited for dashboard analytics.",
        raw_code: "import * as React from 'react'; export function DatePicker() { return <div className='flex gap-2 p-2 bg-charcoal'><button>Today</button><button>Last 7 Days</button></div> }",
        embedding: new Array(1536).fill(0).map(() => Math.random() * 0.1 - 0.05)
    },
    {
        title: "Pricing Data Table",
        description: "A highly responsive data table with sticky headers and pagination built for SaaS billing pages.",
        raw_code: "export const PricingTable = ({ data }) => { return <table className='w-full'><thead><tr><th>Plan</th><th>Price</th></tr></thead><tbody><tr><td>Pro</td><td>$99/mo</td></tr></tbody></table> }",
        embedding: new Array(1536).fill(0).map(() => Math.random() * 0.1 - 0.05)
    }
];

async function seed() {
    console.log('[Seed] Inserting mock components...');
    try {
        for (const item of SEED_DATA) {
            await pool.query(
                `INSERT INTO components (title, description, raw_code, author_id, embedding)
                 VALUES ($1, $2, $3, $4, $5::vector(1536))`,
                [item.title, item.description, item.raw_code, DUMMY_UUID, `[${item.embedding.join(',')}]`]
            );
        }
        console.log('[Seed] Success: Added 3 components to registry.');
        process.exit(0);
    } catch (err) {
        console.error('[Seed] Error:', err);
        process.exit(1);
    }
}

seed();
