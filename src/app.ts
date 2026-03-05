/**
 * Express application factory.
 *
 * Wires together all middleware and route handlers.
 * Kept separate from server.ts to make the app testable
 * (you can import + use it in integration tests without binding to a port).
 */

import express, { Application, NextFunction, Request, Response } from 'express';
import cors from 'cors';
import 'dotenv/config';

// Route handlers
import componentsRouter from './routes/components/search';
import componentsCrudRouter from './routes/components/crud';
import cliRouter from './routes/cli/fetch';
import authRouter from './routes/auth/index';
import categoriesRouter from './routes/categories/index';
import uploadRouter from './routes/upload';
import path from 'path';

// ─── App Factory ──────────────────────────────────────────────────────────────
export function createApp(): Application {
    const app = express();

    // ── Global Middleware ───────────────────────────────────────
    app.use(
        cors({
            // In production, replace '*' with your actual frontend origin(s).
            origin: process.env.NODE_ENV === 'production' ? [] : '*',
            methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
            allowedHeaders: ['Content-Type', 'Authorization'],
        })
    );
    app.use(express.json({ limit: '2mb' })); // generous limit for raw_code payloads

    // ── Health Check ────────────────────────────────────────────
    app.get('/health', (_req: Request, res: Response) => {
        res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    // ── API Routes ──────────────────────────────────────────────
    app.use('/api/components/search', componentsRouter);
    app.use('/api/components', componentsCrudRouter); // list, get by id, create
    app.use('/api/cli/fetch', cliRouter);
    app.use('/api/auth', authRouter);
    app.use('/api/categories', categoriesRouter);
    app.use('/api/upload', uploadRouter);

    // Expose uploads directory so the frontend can render images via `<img src="http://localhost:3000/uploads/..." />`
    app.use('/uploads', express.static(path.join(process.cwd(), 'public', 'uploads')));

    // ── 404 Handler ─────────────────────────────────────────────
    app.use((_req: Request, res: Response) => {
        res.status(404).json({ success: false, error: 'Route not found.' });
    });

    // ── Global Error Handler ────────────────────────────────────
    // Must have 4 parameters for Express to recognize it as an error handler.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
        console.error('[app] Unhandled error:', err);
        res.status(500).json({
            success: false,
            error: 'An unexpected server error occurred.',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined,
        });
    });

    return app;
}
