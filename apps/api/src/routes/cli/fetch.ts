/**
 * POST /api/cli/fetch
 *
 * CLI injection endpoint. Called by the `hub add <component>` CLI tool.
 * Atomically:
 *   1. Looks up the component by ID
 *   2. Increments its `usage_count`
 *   3. Inserts a row into `telemetry_logs` for ROI tracking
 *   4. Returns the raw React/TypeScript source code for CLI injection
 *
 * Both the increment and the telemetry insert happen inside a single
 * database transaction — if the telemetry insert fails, the usage_count
 * is NOT incremented (atomic, consistent behavior).
 *
 * Request body (application/json):
 *   { componentId: string, userId: string, estimatedHoursSaved?: number }
 *
 * Response (200):
 *   { success: true, data: CliFetchResponse }
 *
 * Error responses:
 *   400 — Validation failed
 *   404 — Component not found
 *   500 — Internal DB error
 */

import { Request, Response, Router } from 'express';
import { z } from 'zod';
import { pool } from '../../config/db';
import { ApiResponse, CliFetchRequest, CliFetchResponse } from '../../types';

const router = Router();

// ─── UUID regex ───────────────────────────────────────────────────────────────
const UUID_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ─── Request Validation Schema ────────────────────────────────────────────────
const CliFetchRequestSchema = z.object({
    componentId: z
        .string({ required_error: 'componentId is required' })
        .regex(UUID_REGEX, 'componentId must be a valid UUID'),
    userId: z
        .string({ required_error: 'userId is required' })
        .regex(UUID_REGEX, 'userId must be a valid UUID'),
    estimatedHoursSaved: z
        .number()
        .min(0, 'estimatedHoursSaved cannot be negative')
        .max(999.99, 'estimatedHoursSaved cannot exceed 999.99')
        .optional()
        .default(0),
}) satisfies z.ZodType<CliFetchRequest>;

// ─── DB Row Shapes ────────────────────────────────────────────────────────────
interface ComponentRow {
    id: string;
    title: string;
    description: string;
    raw_code: string;
    author_id: string;
    usage_count: string; // pg returns int as string
}

// ─── Route Handler ────────────────────────────────────────────────────────────
router.post('/', async (req: Request, res: Response<ApiResponse<CliFetchResponse>>) => {
    // 1. Validate request body
    const parsed = CliFetchRequestSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({
            success: false,
            error: 'Invalid request body',
            details: parsed.error.flatten(),
        });
        return;
    }

    const { componentId, userId, estimatedHoursSaved } = parsed.data;

    // 2. Acquire a dedicated client from the pool for a transaction.
    //    This guarantees the usage_count increment and telemetry insert are atomic.
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 2a. Increment usage_count and return the updated component row.
        //     RETURNING * avoids a separate SELECT round-trip.
        //     Parameterized query prevents SQL injection.
        const updateResult = await client.query<ComponentRow>(
            `UPDATE components
       SET usage_count = usage_count + 1
       WHERE id = $1
       RETURNING id, title, description, raw_code, author_id, usage_count`,
            [componentId]
        );

        if (updateResult.rowCount === 0) {
            await client.query('ROLLBACK');
            res.status(404).json({
                success: false,
                error: `Component with id "${componentId}" was not found.`,
            });
            return;
        }

        const component = updateResult.rows[0];

        // 2b. Insert telemetry log entry.
        await client.query(
            `INSERT INTO telemetry_logs (component_id, user_id, estimated_hours_saved)
       VALUES ($1, $2, $3)`,
            [componentId, userId, estimatedHoursSaved]
        );

        await client.query('COMMIT');

        // 3. Respond with the component data ready for CLI injection.
        const responseData: CliFetchResponse = {
            id: component.id,
            title: component.title,
            description: component.description,
            rawCode: component.raw_code,
            usageCount: parseInt(component.usage_count, 10),
            author_id: component.author_id,
        };

        res.status(200).json({ success: true, data: responseData });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('[cli/fetch] Transaction failed, rolled back:', err);
        res.status(500).json({
            success: false,
            error: 'An internal error occurred while fetching the component.',
        });
    } finally {
        // Always release the client back to the pool, even on error.
        client.release();
    }
});

export default router;
