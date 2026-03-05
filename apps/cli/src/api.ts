/**
 * Typed HTTP client for the Enterprise Component Hub API.
 *
 * All network calls from CLI commands go through this module.
 * Surfaces human-readable errors with stylized output — no raw stack traces.
 */

import chalk from 'chalk';
import { ApiResponse, CliFetchResponse, ComponentListItem } from './types.js';

const TIMEOUT_MS = 8_000;

/** Low-level fetch wrapper with timeout and structured error handling. */
async function apiFetch<T>(
    apiUrl: string,
    path: string,
    body: Record<string, unknown>
): Promise<ApiResponse<T>> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
        const response = await fetch(`${apiUrl}${path}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
            signal: controller.signal,
        });

        clearTimeout(timer);
        const json = (await response.json()) as ApiResponse<T>;
        return json;
    } catch (err: unknown) {
        clearTimeout(timer);

        if (err instanceof Error && err.name === 'AbortError') {
            return {
                success: false,
                error: `Request timed out after ${TIMEOUT_MS / 1000}s. Is the hub API running?`,
            };
        }

        const msg = err instanceof Error ? err.message : 'Unknown network error';
        return {
            success: false,
            error: `Network error: ${msg}`,
        };
    }
}

/**
 * Fetch a component by ID — increments usage count and logs telemetry.
 * `POST /api/cli/fetch`
 */
export async function fetchComponent(
    apiUrl: string,
    componentId: string,
    userId: string,
    estimatedHoursSaved: number
): Promise<CliFetchResponse> {
    const result = await apiFetch<CliFetchResponse>(apiUrl, '/api/cli/fetch', {
        componentId,
        userId,
        estimatedHoursSaved,
    });

    if (!result.success) {
        console.error(chalk.red(`\n  ✖  ${result.error}\n`));
        process.exit(1);
    }

    return result.data;
}

/**
 * List all available components for the interactive search prompt.
 * `GET /api/components/list`
 */
export async function listComponents(apiUrl: string): Promise<ComponentListItem[]> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
        const response = await fetch(`${apiUrl}/api/components/list`, {
            signal: controller.signal,
        });
        clearTimeout(timer);

        const json = (await response.json()) as ApiResponse<ComponentListItem[]>;
        if (!json.success) {
            console.error(chalk.red(`\n  ✖  Failed to fetch component list: ${json.error}\n`));
            process.exit(1);
        }
        return json.data;
    } catch (err: unknown) {
        clearTimeout(timer);
        const msg = err instanceof Error ? err.message : 'Unknown error';
        console.error(chalk.red(`\n  ✖  Could not connect to API at ${apiUrl}: ${msg}\n`));
        process.exit(1);
    }
}
