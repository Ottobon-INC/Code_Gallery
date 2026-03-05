/**
 * Category CRUD Routes
 *
 * GET  /api/categories       — Returns all categories
 * POST /api/categories       — Creates a new category
 */
import { Request, Response, Router } from 'express';
import { z } from 'zod';
import { query } from '../../config/db';

const router = Router();

const CreateCategorySchema = z.object({
    label: z.string().min(2, 'Label must be at least 2 characters').max(50),
    icon: z.string().max(10).default('◈'),
});

// ─── GET / ───────────────────────────────────────────────────────────────────
router.get('/', async (_req: Request, res: Response) => {
    try {
        const result = await query(
            'SELECT id, label, icon, created_at FROM categories ORDER BY created_at ASC'
        );
        return res.status(200).json({ success: true, data: result.rows });
    } catch (err) {
        console.error('[categories] List error:', err);
        return res.status(500).json({ success: false, error: 'Failed to fetch categories.' });
    }
});

// ─── POST / ──────────────────────────────────────────────────────────────────
router.post('/', async (req: Request, res: Response) => {
    const parsed = CreateCategorySchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({
            success: false,
            error: 'Validation failed',
            details: parsed.error.flatten().fieldErrors,
        });
    }

    const { label, icon } = parsed.data;
    // Generate a slug-style ID from the label
    const id = label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    try {
        // Check for duplicate
        const existing = await query('SELECT id FROM categories WHERE id = $1', [id]);
        if (existing.rows.length > 0) {
            return res.status(409).json({ success: false, error: 'A category with this name already exists.' });
        }

        const result = await query(
            'INSERT INTO categories (id, label, icon) VALUES ($1, $2, $3) RETURNING id, label, icon, created_at',
            [id, label, icon]
        );
        return res.status(201).json({ success: true, data: result.rows[0] });
    } catch (err) {
        console.error('[categories] Create error:', err);
        return res.status(500).json({ success: false, error: 'Failed to create category.' });
    }
});

export default router;
