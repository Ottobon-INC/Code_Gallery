'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ComponentCard } from '@/components/ComponentCard';
import { NewComponentModal } from '@/components/NewComponentModal';
import { Sidebar } from '@/components/Sidebar';
import { CommandPalette } from '@/components/CommandPalette';
import { Component } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

const CATEGORIES = [
    { id: 'all', label: 'All Components' },
    { id: 'forms', label: 'Forms' },
    { id: 'navigation', label: 'Navigation' },
    { id: 'data-display', label: 'Data Display' },
    { id: 'overlays', label: 'Overlays' },
    { id: 'feedback', label: 'Feedback' },
];

export default function HomePage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const activeCategory = searchParams.get('category') ?? 'all';

    const [components, setComponents] = useState<Component[]>([]);
    const [loading, setLoading] = useState(true);
    const [apiError, setApiError] = useState<string | null>(null);
    const [filterOpen, setFilterOpen] = useState(false);

    const fetchComponents = useCallback(async () => {
        setLoading(true);
        setApiError(null);
        try {
            const categoryParam = activeCategory !== 'all' ? `?category=${activeCategory}` : '';
            const res = await fetch(`${API_URL}/api/components/list${categoryParam}`, { cache: 'no-store' });
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
    }, [activeCategory]);

    useEffect(() => { fetchComponents(); }, [fetchComponents]);

    const setCategory = (cat: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (cat === 'all') {
            params.delete('category');
        } else {
            params.set('category', cat);
        }
        router.push(`/?${params.toString()}`);
    };

    const activeLabel = CATEGORIES.find(c => c.id === activeCategory)?.label ?? 'All Components';

    return (
        <>
            <CommandPalette />
            <div className="flex min-h-screen">
                <Sidebar activeCategory={activeCategory} onCategoryChange={setCategory} />
                <main className="flex-1 min-w-0 overflow-y-auto">
                    <div className="p-10 max-w-[1600px] 2xl:mx-auto">
                        {/* Page header */}
                        <div className="mb-10 flex items-end justify-between">
                            <div>
                                <h1 className="text-hub-text text-2xl font-bold tracking-tight mb-2">
                                    {activeLabel}
                                </h1>
                                <p className="text-hub-muted text-sm">
                                    Browse and inject{' '}
                                    <span className="text-hub-text font-medium">{loading ? '...' : components.length}</span>{' '}
                                    curated UI components. Press{' '}
                                    <kbd className="font-mono text-[10px] bg-hub-surface border border-hub-border rounded px-1.5 py-0.5">⌘K</kbd>{' '}
                                    to search.
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                {/* Filter Dropdown */}
                                <div className="relative">
                                    <button
                                        onClick={() => setFilterOpen(!filterOpen)}
                                        className={`flex items-center gap-2 bg-hub-surface border text-hub-text text-xs font-semibold px-4 py-2.5 rounded-md hover:bg-white/5 transition-colors ${activeCategory !== 'all'
                                                ? 'border-blue-500/50 text-blue-400'
                                                : 'border-hub-border'
                                            }`}
                                    >
                                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                                        </svg>
                                        {activeCategory !== 'all' ? activeLabel : 'Filter'}
                                    </button>

                                    {filterOpen && (
                                        <div className="absolute right-0 top-full mt-2 w-48 bg-[#1a1a1f] border border-white/15 rounded-lg shadow-xl z-50 py-1.5 overflow-hidden">
                                            {CATEGORIES.map(cat => (
                                                <button
                                                    key={cat.id}
                                                    onClick={() => { setCategory(cat.id); setFilterOpen(false); }}
                                                    className={`w-full text-left px-4 py-2 text-xs font-medium transition-colors ${activeCategory === cat.id
                                                            ? 'bg-blue-500/10 text-blue-400'
                                                            : 'text-hub-muted hover:bg-white/5 hover:text-white'
                                                        }`}
                                                >
                                                    {cat.label}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

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

                        {/* Empty state */}
                        {!loading && !apiError && components.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-32 text-center rounded-xl border border-dashed border-hub-border">
                                <div className="text-4xl mb-4 opacity-50">◈</div>
                                <h3 className="text-hub-text text-base font-semibold">
                                    {activeCategory !== 'all' ? `No "${activeLabel}" components found` : 'No components found'}
                                </h3>
                                <p className="text-hub-muted text-sm mt-2 max-w-sm">
                                    Click <strong className="text-hub-text">+ New Component</strong> to add your first component to the registry.
                                </p>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </>
    );
}
