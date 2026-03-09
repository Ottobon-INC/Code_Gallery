/**
 * Component CRUD Routes
 * 
 * GET  /api/components/list  — Returns all components (for dashboard)
 * POST /api/components        — Creates a new component
 */
import { Request, Response, Router } from 'express';
import { z } from 'zod';
import { query } from '../../config/db';

const router = Router();

// ─── Validation Schema ───────────────────────────────────────────────────────
const VALID_STACKS = ['vite-react-ts', 'vite-react', 'vue', 'svelte', 'angular', 'vanilla', 'static'] as const;

const CreateComponentSchema = z.object({
    title: z.string().min(2, 'Title must be at least 2 characters').max(100),
    description: z.string().min(10, 'Description must be at least 10 characters').max(1000),
    raw_code: z.string().min(10, 'Code is required').max(50000),
    author_id: z.string().uuid('author_id must be a valid UUID'),
    stack: z.enum(VALID_STACKS).default('vite-react-ts'),
    category: z.string().max(50).default('uncategorized'),
    image_url: z.string().optional(),
});

// ─── GET /list ───────────────────────────────────────────────────────────────
router.get('/list', async (req: Request, res: Response) => {
    try {
        const category = req.query.category as string | undefined;
        const userId = req.query.userId as string | undefined;

        let sql = `SELECT c.id, c.title, c.description, c.raw_code, c.author_id,
                   COALESCE(u.name, split_part(u.email, '@', 1)) AS author_name,
                   c.usage_count, c.likes, c.stack, c.category, c.image_url, c.created_at`;

        if (userId) {
            sql += `, EXISTS(SELECT 1 FROM component_likes cl WHERE cl.component_id = c.id AND cl.user_id = $1) AS user_liked`;
        } else {
            sql += `, false AS user_liked`;
        }

        sql += `
            FROM components c
            LEFT JOIN users u ON u.id = c.author_id`;

        const values: string[] = [];
        if (userId) values.push(userId);

        if (category && category !== 'all') {
            values.push(category);
            sql += ` WHERE c.category = $${values.length}`;
        }
        sql += ` ORDER BY c.created_at DESC`;

        const result = await query(sql, values);
        return res.status(200).json({ success: true, data: result.rows });
    } catch (err) {
        console.error('[components] List error:', err);
        return res.status(500).json({ success: false, error: 'Failed to fetch components.' });
    }
});

// ─── GET /:id ────────────────────────────────────────────────────────────────
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.query.userId as string | undefined;

        let sql = `SELECT c.id, c.title, c.description, c.raw_code, c.author_id,
                   COALESCE(u.name, split_part(u.email, '@', 1)) AS author_name,
                   c.usage_count, c.likes, c.stack, c.category, c.image_url, c.created_at`;

        if (userId) {
            sql += `, EXISTS(SELECT 1 FROM component_likes cl WHERE cl.component_id = c.id AND cl.user_id = $2) AS user_liked`;
        } else {
            sql += `, false AS user_liked`;
        }

        sql += `
             FROM components c
             LEFT JOIN users u ON u.id = c.author_id
             WHERE c.id = $1`;

        const values: any[] = [id];
        if (userId) values.push(userId);

        const result = await query(sql, values);
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Component not found.' });
        }
        return res.status(200).json({ success: true, data: result.rows[0] });
    } catch (err) {
        console.error('[components] Get error:', err);
        return res.status(500).json({ success: false, error: 'Failed to fetch component.' });
    }
});

// ─── POST / — Create a new component ─────────────────────────────────────────
router.post('/', async (req: Request, res: Response) => {
    const parsed = CreateComponentSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({
            success: false,
            error: 'Validation failed',
            details: parsed.error.flatten().fieldErrors,
        });
    }

    const { title, description, raw_code, author_id, stack, category, image_url } = parsed.data;

    try {
        // Attempt to generate an embedding — gracefully skip if LLM is unavailable
        let embeddingClause = '';
        const values: unknown[] = [title, description, raw_code, author_id, stack, category, image_url || null];

        try {
            const { generateComponentEmbedding } = await import('../../services/embedding');
            const vector = await generateComponentEmbedding(title, description, raw_code);
            embeddingClause = `, embedding = $8::vector(1536)`;
            values.push(`[${vector.join(',')}]`);
        } catch (embErr) {
            console.warn('[components] Embedding generation skipped (LLM unavailable):', embErr);
        }

        const sql = `
            INSERT INTO components (title, description, raw_code, author_id, stack, category, image_url${embeddingClause ? ', embedding' : ''})
            VALUES ($1, $2, $3, $4, $5, $6, $7${embeddingClause ? ', $8::vector(1536)' : ''})
            RETURNING id, title, description, author_id, usage_count, likes, stack, category, image_url, created_at
        `;

        const result = await query(sql, values);
        return res.status(201).json({ success: true, data: result.rows[0] });
    } catch (err) {
        console.error('[components] Create error:', err);
        return res.status(500).json({ success: false, error: 'Failed to create component.' });
    }
});

// ─── POST /:id/like — Toggle like (one per user, stored in junction table) ────
router.post('/:id/like', async (req: Request, res: Response) => {
    const { id } = req.params;
    const { user_id } = req.body;

    if (!user_id) {
        return res.status(400).json({ success: false, error: 'user_id is required to like a component.' });
    }

    try {
        // Check if this user already liked this component
        const existing = await query(
            'SELECT id FROM component_likes WHERE component_id = $1 AND user_id = $2',
            [id, user_id]
        );

        let liked: boolean;
        if (existing.rows.length > 0) {
            // Already liked — unlike it
            await query('DELETE FROM component_likes WHERE component_id = $1 AND user_id = $2', [id, user_id]);
            await query('UPDATE components SET likes = GREATEST(0, likes - 1) WHERE id = $1', [id]);
            liked = false;
        } else {
            // Not yet liked — insert and increment
            await query(
                'INSERT INTO component_likes (component_id, user_id) VALUES ($1, $2)',
                [id, user_id]
            );
            await query('UPDATE components SET likes = likes + 1 WHERE id = $1', [id]);
            liked = true;
        }

        const updated = await query('SELECT likes FROM components WHERE id = $1', [id]);
        return res.status(200).json({
            success: true,
            data: { liked, likes: updated.rows[0]?.likes ?? 0 }
        });
    } catch (err) {
        console.error('[components] Like error:', err);
        return res.status(500).json({ success: false, error: 'Failed to toggle like.' });
    }
});

// ─── GET /:id/likers — Who liked this component ───────────────────────────────
router.get('/:id/likers', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const result = await query(
            `SELECT COALESCE(u.name, split_part(u.email, '@', 1)) AS name
             FROM component_likes cl
             JOIN users u ON u.id = cl.user_id
             WHERE cl.component_id = $1
             ORDER BY cl.created_at ASC
             LIMIT 20`,
            [id]
        );
        return res.status(200).json({
            success: true,
            data: (result.rows as { name: string }[]).map(r => r.name)
        });
    } catch (err) {
        console.error('[components] Likers error:', err);
        return res.status(500).json({ success: false, error: 'Failed to fetch likers.' });
    }
});

export default router;
