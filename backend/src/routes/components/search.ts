/**
 * POST /api/components/search
 *
 * Semantic search endpoint. Accepts a natural-language query, converts it
 * to a 1536-dim embedding via OpenAI, then runs a pgvector cosine-similarity
 * search against the `components` table.
 *
 * Request body (application/json):
 *   { query: string, limit?: number }
 *
 * Response (200):
 *   { success: true, data: { results: SearchResult[], count: number } }
 *
 * Error responses:
 *   400 — Validation failed (bad request body)
 *   500 — Internal error (DB or OpenAI failure)
 */

import { Request, Response, Router } from 'express';
import { z } from 'zod';
import { query } from '../../config/db';
import { getEmbedding } from '../../lib/llm-provider';
import { ApiResponse, SearchResponse, SearchResult } from '../../types';

const router = Router();

// ─── Request Validation Schema ────────────────────────────────────────────────
const SearchRequestSchema = z.object({
    query: z
        .string({ required_error: 'query is required' })
        .min(3, 'query must be at least 3 characters')
        .max(1000, 'query must not exceed 1000 characters'),
    limit: z
        .number()
        .int()
        .min(1)
        .max(50)
        .optional()
        .default(10),
});

// ─── DB Row Shape (what pgvector query returns) ───────────────────────────────
interface SearchRow {
    id: string;
    title: string;
    description: string;
    author_id: string;
    usage_count: string; // pg returns numeric columns as strings
    likes: string;
    created_at: Date;
    similarity: string;  // cosine similarity score (0–1), returned as string by pg
}

// ─── Route Handler ────────────────────────────────────────────────────────────
router.post('/', async (req: Request, res: Response<ApiResponse<SearchResponse>>) => {
    // 1. Validate request body
    const parsed = SearchRequestSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({
            success: false,
            error: 'Invalid request body',
            details: parsed.error.flatten(),
        });
        return;
    }

    const { query: searchQuery, limit } = parsed.data;

    // 2. Generate embedding + execute search
    try {
        // Attempt Semantic Search (Primary)
        const embedding = await getEmbedding(searchQuery);
        const embeddingLiteral = `[${embedding.join(',')}]`;

        const sql = `SELECT * FROM match_components($1::vector(1536), $2::int)`;
        const result = await query<SearchRow>(sql, [embeddingLiteral, limit]);

        const results: SearchResult[] = result.rows.map((row) => ({
            id: row.id,
            title: row.title,
            description: row.description,
            author_id: row.author_id,
            usage_count: parseInt(row.usage_count, 10),
            likes: parseInt(row.likes, 10),
            created_at: row.created_at,
            similarity: parseFloat(row.similarity),
        }));

        res.status(200).json({
            success: true,
            data: { results, count: results.length },
        });

    } catch (err) {
        // 3. Fallback: Lexical Search (ILIKE)
        // If OpenAI goes down or rate limits, gracefully degrade the UX
        // instead of returning a 500 error to the client.
        console.warn('[search] Embedding failed, falling back to ILIKE lexical search:', err);

        const fallbackSql = `
            SELECT 
                id, title, description, author_id, usage_count, likes, created_at,
                1.0 AS similarity -- Fake perfect match for lexical fallback
            FROM components
            WHERE title ILIKE $1 OR description ILIKE $1
            LIMIT $2
        `;
        const wildcardQuery = `%${searchQuery}%`;

        try {
            const result = await query<SearchRow>(fallbackSql, [wildcardQuery, limit]);
            const results: SearchResult[] = result.rows.map((row) => ({
                id: row.id,
                title: row.title,
                description: row.description,
                author_id: row.author_id,
                usage_count: parseInt(row.usage_count, 10),
                likes: parseInt(row.likes, 10),
                created_at: row.created_at,
                similarity: 1.0, // Indication that this was a fallback match
            }));

            res.status(200).json({
                success: true,
                data: { results, count: results.length },
            });
        } catch (dbErr) {
            console.error('[search] Fallback Database query failed:', dbErr);
            res.status(500).json({
                success: false,
                error: 'Database query failed.',
            });
        }
    }
});

export default router;
