/**
 * Shared TypeScript types for the ottobon-hub CLI.
 */

/** Persisted configuration written by `ottobon-hub init`. */
export interface HubConfig {
    /** Absolute path to directory where components will be injected. */
    outputDir: string;
    /** The API base URL — defaults to http://localhost:3000 */
    apiUrl: string;
    /** Developer's user ID for telemetry attribution. */
    userId: string;
}

/** A component entry returned by the listing endpoint. */
export interface ComponentListItem {
    id: string;
    title: string;
    description: string;
    usage_count: number;
}

/** Response from POST /api/cli/fetch */
export interface CliFetchResponse {
    id: string;
    title: string;
    description: string;
    rawCode: string;
    usageCount: number;
    author_id: string;
}

/** Generic API success envelope */
export interface ApiSuccess<T> {
    success: true;
    data: T;
}

/** Generic API error envelope */
export interface ApiError {
    success: false;
    error: string;
    details?: unknown;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;
