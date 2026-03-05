'use client';

import { useEffect, useState, useCallback } from 'react';
import { Command } from 'cmdk';
import { useRouter } from 'next/navigation';
import type { SearchResult } from '@/types';
import { api } from '@/lib/api';

export function CommandPalette() {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault(); setOpen((o) => !o);
            }
            if (e.key === 'Escape') setOpen(false);
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);

    const search = useCallback(async (q: string) => {
        if (q.trim().length < 2) { setResults([]); return; }
        setLoading(true);
        try {
            const res = await api.components.search(q, 8);
            setResults(res.results);
        } catch { setResults([]); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => {
        const t = setTimeout(() => search(query), 300);
        return () => clearTimeout(t);
    }, [query, search]);

    const handleSelect = (id: string) => {
        setOpen(false); setQuery(''); setResults([]);
        router.push(`/components/${id}`);
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] animate-fade-in" onClick={() => setOpen(false)}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

            <div className="relative w-full max-w-xl glass rounded-card shadow-card animate-slide-up overflow-hidden" onClick={(e) => e.stopPropagation()}>
                <Command className="w-full" shouldFilter={false}>
                    <div className="flex items-center gap-3 px-4 py-3 border-b border-hub-border">
                        <span className="text-hub-muted text-sm">⌕</span>
                        <Command.Input
                            value={query}
                            onValueChange={setQuery}
                            placeholder="Search components by concept, name, or use case…"
                            className="flex-1 bg-transparent text-hub-text text-sm placeholder:text-hub-muted outline-none"
                            autoFocus
                        />
                        {loading && <span className="text-[10px] text-hub-muted animate-pulse">searching…</span>}
                        <kbd className="text-[10px] text-hub-muted border border-hub-border bg-hub-bg rounded px-1.5 py-0.5">ESC</kbd>
                    </div>

                    <Command.List className="max-h-80 overflow-y-auto py-2">
                        {results.length === 0 && query.length >= 2 && !loading && (
                            <Command.Empty className="py-8 text-center text-hub-muted text-sm">
                                No components found for "{query}"
                            </Command.Empty>
                        )}

                        {results.length > 0 && (
                            <Command.Group heading={<span className="px-4 pb-1 pt-2 block text-[10px] uppercase tracking-widest text-hub-muted font-semibold">Results</span>}>
                                {results.map((r) => (
                                    <Command.Item
                                        key={r.id}
                                        value={r.id}
                                        onSelect={() => handleSelect(r.id)}
                                        className="flex items-start gap-3 px-4 py-2.5 cursor-pointer hover:bg-white/5 data-[selected]:bg-white/5 transition-colors group"
                                    >
                                        <span className="mt-0.5 text-hub-muted text-xs">◈</span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-hub-text text-sm font-medium truncate group-data-[selected]:text-white">{r.title}</p>
                                            <p className="text-hub-muted text-xs mt-0.5 truncate">{r.description}</p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <span className="text-[10px] text-hub-muted">{Math.round(r.similarity * 100)}% match</span>
                                        </div>
                                    </Command.Item>
                                ))}
                            </Command.Group>
                        )}
                        {query.length === 0 && (
                            <div className="py-6 text-center text-hub-muted text-xs">Type to semantically search across all components</div>
                        )}
                    </Command.List>

                    <div className="px-4 py-2 border-t border-hub-border bg-hub-bg flex items-center gap-4 text-[10px] text-hub-muted">
                        <span><kbd className="border border-hub-border bg-hub-surface rounded px-1">↵</kbd> open</span>
                        <span><kbd className="border border-hub-border bg-hub-surface rounded px-1">↑↓</kbd> navigate</span>
                    </div>
                </Command>
            </div>
        </div>
    );
}
