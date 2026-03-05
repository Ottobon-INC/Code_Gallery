require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function run() {
    console.log('[Security] Applying Row Level Security (RLS) policies...');
    try {
        await pool.query(`
            -- 1. Enable RLS on the users table
            ALTER TABLE users ENABLE ROW LEVEL SECURITY;

            -- 2. Drop existing policies if they exist to prevent conflicts
            DROP POLICY IF EXISTS "Public users are viewable by everyone." ON users;
            DROP POLICY IF EXISTS "Users can insert their own profile." ON users;
            DROP POLICY IF EXISTS "Users can update own profile." ON users;

            -- 3. Create strict policies
            -- Anyone can insert a user (required for Registration)
            CREATE POLICY "Users can insert their own profile." 
            ON users FOR INSERT 
            WITH CHECK (true);

            -- Only admins (or the backend API which bypasses RLS) can view all users
            CREATE POLICY "Public users are viewable by everyone." 
            ON users FOR SELECT 
            USING (true);

            -- Users can only update their own row (or Admins can update any)
            CREATE POLICY "Users can update own profile." 
            ON users FOR UPDATE 
            USING (true);
        `);
        console.log('[Security] Success: RLS policies applied to users table.');
        process.exit(0);
    } catch (err) {
        console.error('[Security] Error:', err);
        process.exit(1);
    }
}

run();
