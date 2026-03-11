import { Request, Response, Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { query } from '../../config/db';

const router = Router();

// Configure Nodemailer transporter based on ENV vars
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.sendgrid.net',
    port: parseInt(process.env.SMTP_PORT || '587'),
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

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

// ─── Forgot Password ────────────────────────────────────────────────────────
const ForgotPasswordSchema = z.object({
    email: z.string().email(),
});

router.post('/forgot-password', async (req: Request, res: Response) => {
    try {
        const { email } = ForgotPasswordSchema.parse(req.body);

        const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
        if (existing.rows.length === 0) {
            // Return success even if email doesn't exist to prevent email enumeration
            return res.status(200).json({ success: true, message: 'If an account exists, a reset link was generated.' });
        }

        // Generate a random token
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

        await query(
            'UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE email = $3',
            [token, expiresAt.toISOString(), email]
        );

        // Create the reset link using the web app URL
        // We'll assume the web app runs on localhost:3001 in dev, but can be overridden
        const webUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
        const resetLink = `${webUrl}/reset-password?token=${token}`;

        // Send the email via SMTP if credentials exist (otherwise mock it)
        if (process.env.SMTP_USER && process.env.SMTP_PASS) {
            await transporter.sendMail({
                from: process.env.SMTP_FROM || '"Ottobon Hub" <noreply@ottobon.in>',
                to: email,
                subject: 'Reset your password for Ottobon Hub',
                text: `You requested a password reset. Click this link to reset your password:\n\n${resetLink}\n\nIf you did not request this, please ignore this email.`,
                html: `<p>You requested a password reset. Click the link below to reset your password:</p>
                       <p><a href="${resetLink}">Reset Password</a></p>
                       <p>If you did not request this, please ignore this email.</p>`,
            });
        } else {
            // Development fallback: Log it to the server console if no SMTP configured
            console.log(`\n[DEV MODE] Password reset requested for ${email}`);
            console.log(`[DEV MODE] Reset link: ${resetLink}\n`);
        }

        return res.status(200).json({
            success: true,
            message: 'Reset link generated and sent to your email.'
        });
    } catch (err) {
        if (err instanceof z.ZodError) {
            return res.status(400).json({ success: false, error: 'Valid email is required' });
        }
        console.error('[auth] Forgot password error:', err);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// ─── Reset Password ─────────────────────────────────────────────────────────
const ResetPasswordSchema = z.object({
    token: z.string().min(1),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});

router.post('/reset-password', async (req: Request, res: Response) => {
    try {
        const { token, password } = ResetPasswordSchema.parse(req.body);

        // Find user with matching token that hasn't expired
        const userRes = await query(
            'SELECT id FROM users WHERE reset_token = $1 AND reset_token_expires > NOW()',
            [token]
        );

        if (userRes.rows.length === 0) {
            return res.status(400).json({ success: false, error: 'Invalid or expired reset token' });
        }

        const userId = userRes.rows[0].id;
        const hash = await bcrypt.hash(password, 10);

        // Update password and clear the token
        await query(
            'UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL WHERE id = $2',
            [hash, userId]
        );

        return res.status(200).json({ success: true, message: 'Password has been reset successfully' });
    } catch (err) {
        if (err instanceof z.ZodError) {
            return res.status(400).json({ success: false, error: 'Valid token and password are required' });
        }
        console.error('[auth] Reset password error:', err);
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
