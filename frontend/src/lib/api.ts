/**
 * Typed API client for the frontend.
 * All calls proxy to NEXT_PUBLIC_API_URL (defaults to http://localhost:3000).
 */

import type { ApiResponse, Component, SearchResult, Bounty, LeaderboardEntry } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

async function post<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(`${API_URL}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    const json = (await res.json()) as ApiResponse<T>;
    if (!json.success) throw new Error(json.error);
    return json.data;
}

async function get<T>(path: string): Promise<T> {
    const res = await fetch(`${API_URL}${path}`, { next: { revalidate: 60 } });
    const json = (await res.json()) as ApiResponse<T>;
    if (!json.success) throw new Error(json.error);
    return json.data;
}

export const api = {
    components: {
        list: () => get<Component[]>('/api/components/list'),
        get: (id: string) => get<Component>(`/api/components/${id}`),
        search: (query: string, limit = 8) =>
            post<{ results: SearchResult[]; count: number }>('/api/components/search', { query, limit }),
        fetch: (componentId: string, userId: string, estimatedHoursSaved: number) =>
            post('/api/cli/fetch', { componentId, userId, estimatedHoursSaved }),
    },
    bounties: {
        list: () => get<Bounty[]>('/api/bounties'),
        create: (data: { title: string; description: string; requested_by: string }) =>
            post<Bounty>('/api/bounties', data),
        updateStatus: (id: string, status: Bounty['status']) =>
            post<Bounty>(`/api/bounties/${id}/status`, { status }),
    },
    analytics: {
        leaderboard: () => get<LeaderboardEntry[]>('/api/analytics/leaderboard'),
    },
};
