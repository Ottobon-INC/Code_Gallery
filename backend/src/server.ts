/**
 * HTTP Server entry point.
 *
 * Starts the Express app on the configured port.
 * Run with:
 *   npm run dev   (ts-node + nodemon, auto-reloads on file changes)
 *   npm start     (compiled JS from dist/)
 */

import { createApp } from './app';

const PORT = parseInt(process.env.PORT ?? '3000', 10);

const app = createApp();

const server = app.listen(PORT, () => {
    console.log(`\n🚀 Enterprise Component Hub API`);
    console.log(`   Listening on http://localhost:${PORT}`);
    console.log(`   Environment: ${process.env.NODE_ENV ?? 'development'}`);
    console.log(`   Health: http://localhost:${PORT}/health\n`);
});

// ── Graceful Shutdown ─────────────────────────────────────────────────────────
// Allow in-flight requests to complete before closing during deployments.
function shutdown(signal: string): void {
    console.log(`\n[server] ${signal} received. Shutting down gracefully…`);
    server.close(() => {
        console.log('[server] HTTP server closed.');
        process.exit(0);
    });
    // Force quit if graceful shutdown takes too long (e.g. stuck DB queries)
    setTimeout(() => {
        console.error('[server] Forced shutdown after timeout.');
        process.exit(1);
    }, 10_000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
