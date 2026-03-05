import { Request, Response, Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { query } from '../../config/db';

const router = Router();

const LoginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
});

router.post('/login', async (req: Request, res: Response) => {
    try {
        const { email, password } = LoginSchema.parse(req.body);

        const result = await query<{
            id: string;
            email: string;
            name: string | null;
            password_hash: string;
            is_approved: boolean;
            is_admin: boolean;
        }>('SELECT id, email, name, password_hash, is_approved, is_admin FROM users WHERE email = $1', [email]);

        if (result.rows.length === 0) {
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }

        const user = result.rows[0];
        const isValid = await bcrypt.compare(password, user.password_hash);

        if (!isValid) {
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }

        return res.status(200).json({
            success: true,
            data: {
                id: user.id,
                email: user.email,
                name: user.name,
                is_approved: user.is_approved,
                is_admin: user.is_admin,
            },
        });
    } catch (err) {
        if (err instanceof z.ZodError) {
            return res.status(400).json({ success: false, error: 'Email and password are required' });
        }
        console.error('[auth] Login error:', err);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

router.post('/register', async (req: Request, res: Response) => {
    try {
        const { email, password } = LoginSchema.parse(req.body);

        const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
        if (existing.rows.length > 0) {
            return res.status(400).json({ success: false, error: 'Email already exists' });
        }

        const hash = await bcrypt.hash(password, 10);

        // Auto-approve the first user as admin (for bootstrapping). Otherwise, set false.
        const countRes = await query<{ count: string }>('SELECT COUNT(*) FROM users');
        const isFirstUser = parseInt(countRes.rows[0].count, 10) === 0;

        const result = await query<{
            id: string;
            email: string;
            is_approved: boolean;
            is_admin: boolean;
        }>(
            'INSERT INTO users (email, password_hash, is_approved, is_admin) VALUES ($1, $2, $3, $4) RETURNING id, email, is_approved, is_admin',
            [email, hash, isFirstUser, isFirstUser]
        );

        return res.status(201).json({
            success: true,
            data: result.rows[0],
        });
    } catch (err) {
        if (err instanceof z.ZodError) {
            return res.status(400).json({ success: false, error: 'Email and password are required' });
        }
        console.error('[auth] Register error:', err);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// Admin Route: Get all pending users
router.get('/users/pending', async (_req: Request, res: Response) => {
    try {
        const result = await query(
            'SELECT id, email, created_at FROM users WHERE is_approved = false ORDER BY created_at ASC'
        );
        return res.status(200).json({ success: true, data: result.rows });
    } catch (err) {
        console.error('[auth] Fetch pending users error:', err);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// Admin Route: Approve user
router.post('/users/:id/approve', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const result = await query(
            'UPDATE users SET is_approved = true WHERE id = $1 RETURNING id, email, is_approved',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        return res.status(200).json({ success: true, data: result.rows[0] });
    } catch (err) {
        console.error('[auth] Approve user error:', err);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

export default router;
