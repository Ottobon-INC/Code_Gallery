/**
 * Shared TypeScript types for the Enterprise Component Hub API.
 *
 * These interfaces map 1-to-1 with the database schema and are used
 * across database queries, route handlers, and API responses to ensure
 * end-to-end type safety.
 */

// ─── Database Row Shapes ──────────────────────────────────────────────────────

/** A component as stored in the `components` table. */
export interface Component {
    id: string;
    title: string;
    description: string;
    raw_code: string;
    author_id: string;
    usage_count: number;
    likes: number;
    /** pgvector embedding — present on DB rows, omitted from most API responses. */
    embedding?: number[];
    created_at: Date;
    updated_at: Date;
}

/** A bounty as stored in the `bounties` table. */
export interface Bounty {
    id: string;
    title: string;
    description: string;
    status: BountyStatus;
    requested_by: string;
    /** Null until a developer claims the bounty. */
    claimed_by: string | null;
    created_at: Date;
    updated_at: Date;
}

export type BountyStatus = 'requested' | 'in-progress' | 'completed';

/** A telemetry log entry as stored in the `telemetry_logs` table. */
export interface TelemetryLog {
    id: string;
    component_id: string;
    user_id: string;
    timestamp: Date;
    estimated_hours_saved: number;
}

// ─── POST /api/components/search ─────────────────────────────────────────────

/** Request body for semantic component search. */
export interface SearchRequest {
    /** Natural language query, e.g. "date picker with range selection" */
    query: string;
    /** Max results to return (default 10, max 50). */
    limit?: number;
}

/** A single result returned from semantic search. */
export interface SearchResult {
    id: string;
    title: string;
    description: string;
    author_id: string;
    usage_count: number;
    likes: number;
    created_at: Date;
    /** Cosine similarity score (0–1, higher = more relevant). */
    similarity: number;
}

/** Response envelope for the search endpoint. */
export interface SearchResponse {
    results: SearchResult[];
    count: number;
}

// ─── POST /api/cli/fetch ──────────────────────────────────────────────────────

/** Request body sent by the CLI when a developer runs `hub add <component>`. */
export interface CliFetchRequest {
    /** UUID of the component to fetch. */
    componentId: string;
    /** UUID of the developer running the CLI command. */
    userId: string;
    /**
     * Estimated hours the developer would have spent building this component
     * from scratch. Used for ROI analytics.
     * @default 0
     */
    estimatedHoursSaved?: number;
}

/** Response from the CLI fetch endpoint — contains the raw code for injection. */
export interface CliFetchResponse {
    id: string;
    title: string;
    description: string;
    /** The raw React/TypeScript source code to inject into the developer's project. */
    rawCode: string;
    /** Updated usage count (after increment). */
    usageCount: number;
    author_id: string;
}

// ─── Generic API Response Wrappers ───────────────────────────────────────────

export interface ApiSuccessResponse<T> {
    success: true;
    data: T;
}

export interface ApiErrorResponse {
    success: false;
    error: string;
    details?: unknown;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
