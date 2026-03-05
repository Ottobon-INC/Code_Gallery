'use client';

import { useState, useEffect, useCallback } from 'react';
import { ComponentCard } from '@/components/ComponentCard';
import { NewComponentModal } from '@/components/NewComponentModal';
import { Component } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

export default function HomePage() {
    const [components, setComponents] = useState<Component[]>([]);
    const [loading, setLoading] = useState(true);
    const [apiError, setApiError] = useState<string | null>(null);

    const fetchComponents = useCallback(async () => {
        setLoading(true);
        setApiError(null);
        try {
            const res = await fetch(`${API_URL}/api/components/list`, { cache: 'no-store' });
            if (!res.ok) throw new Error(`API returned ${res.status}`);
            const json = await res.json();
            if (json.success) {
                setComponents(json.data);
            } else {
                setApiError(json.error ?? 'Failed to load components');
            }
        } catch (err) {
            console.error('[HomePage] Fetch error:', err);
            setApiError('Could not reach the API. Is the backend running on port 3000?');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchComponents(); }, [fetchComponents]);

    return (
        <div className="p-10 max-w-[1600px] 2xl:mx-auto">
            {/* Page header */}
            <div className="mb-10 flex items-end justify-between">
                <div>
                    <h1 className="text-hub-text text-2xl font-bold tracking-tight mb-2">Component Library</h1>
                    <p className="text-hub-muted text-sm">
                        Browse and inject{' '}
                        <span className="text-hub-text font-medium">{loading ? '...' : components.length}</span>{' '}
                        curated UI components. Press{' '}
                        <kbd className="font-mono text-[10px] bg-hub-surface border border-hub-border rounded px-1.5 py-0.5">⌘K</kbd>{' '}
                        to search.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button className="bg-hub-surface border border-hub-border text-hub-text text-xs font-semibold px-4 py-2.5 rounded-md hover:bg-white/5 transition-colors">
                        Filter
                    </button>
                    <NewComponentModal onSuccess={fetchComponents} />
                </div>
            </div>

            {/* API error banner */}
            {apiError && (
                <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm flex items-start gap-2">
                    <span>⚠</span>
                    <span>{apiError}</span>
                </div>
            )}

            {/* Loading state */}
            {loading && (
                <div className="flex justify-center py-32">
                    <div className="flex items-center gap-3 text-hub-muted text-sm">
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Loading components...
                    </div>
                </div>
            )}

            {/* Component grid */}
            {!loading && components.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5">
                    {components.map((c) => (
                        <ComponentCard key={c.id} component={c} />
                    ))}
                </div>
            )}

            {/* Empty state — only show if no error and not loading */}
            {!loading && !apiError && components.length === 0 && (
                <div className="flex flex-col items-center justify-center py-32 text-center rounded-xl border border-dashed border-hub-border">
                    <div className="text-4xl mb-4 opacity-50">◈</div>
                    <h3 className="text-hub-text text-base font-semibold">No components found</h3>
                    <p className="text-hub-muted text-sm mt-2 max-w-sm">
                        Click <strong className="text-hub-text">+ New Component</strong> to add your first component to the registry.
                    </p>
                </div>
            )}
        </div>
    );
}
