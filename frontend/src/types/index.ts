/** Shared TypeScript types for the frontend. */

export type SandpackTemplate =
    | 'vite-react-ts'
    | 'vite-react'
    | 'vue'
    | 'svelte'
    | 'angular'
    | 'vanilla'
    | 'static';

export type Component = {
    id: string;
    title: string;
    description: string;
    raw_code: string;
    stack: SandpackTemplate;
    category?: string;
    image_url?: string;
    author_id: string;
    author_name?: string;   // resolved via JOIN with users table
    usage_count: number;
    likes: number;
    created_at: string;
    updated_at: string;
};

export interface Bounty {
    id: string;
    title: string;
    description: string;
    status: 'requested' | 'in-progress' | 'completed';
    requested_by: string;
    claimed_by: string | null;
    created_at: string;
    updated_at: string;
}

export interface TelemetryLog {
    id: string;
    component_id: string;
    user_id: string;
    timestamp: string;
    estimated_hours_saved: number;
}

export interface LeaderboardEntry {
    user_id: string;
    total_hours_saved: number;
    components_injected: number;
    bounties_claimed: number;
    rank: number;
}

export interface SearchResult {
    id: string;
    title: string;
    description: string;
    author_id: string;
    usage_count: number;
    likes: number;
    created_at: string;
    similarity: number;
}

// ── API Response shapes ──────────────────────────────────────────────────────
export interface ApiSuccess<T> { success: true; data: T }
export interface ApiError { success: false; error: string }
export type ApiResponse<T> = ApiSuccess<T> | ApiError;
