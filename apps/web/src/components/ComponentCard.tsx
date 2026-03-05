'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import type { Component } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

interface ComponentCardProps {
    component: Component;
}

export function ComponentCard({ component }: ComponentCardProps) {
    const { data: session } = useSession();
    const userId = (session?.user as { id?: string })?.id;

    const [likes, setLikes] = useState(component.likes);
    const [liked, setLiked] = useState(false);
    const [copied, setCopied] = useState(false);

    // Likers tooltip state
    const [showTooltip, setShowTooltip] = useState(false);
    const [likers, setLikers] = useState<string[]>([]);
    const [loadingLikers, setLoadingLikers] = useState(false);
    const tooltipTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    // ── Like toggle ───────────────────────────────────────────────────────────
    const handleLike = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!userId) return; // user must be logged in

        // Optimistic update
        const wasLiked = liked;
        setLiked(!wasLiked);
        setLikes(prev => wasLiked ? prev - 1 : prev + 1);

        try {
            const res = await fetch(`${API_URL}/api/components/${component.id}/like`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: userId }),
            });
            const json = await res.json();
            if (json.success) {
                setLiked(json.data.liked);
                setLikes(json.data.likes);
                // Refresh likers cache after toggling
                setLikers([]);
            } else {
                // Revert optimistic update on failure
                setLiked(wasLiked);
                setLikes(prev => wasLiked ? prev + 1 : prev - 1);
            }
        } catch {
            setLiked(wasLiked);
            setLikes(prev => wasLiked ? prev + 1 : prev - 1);
        }
    };

    // ── Likers tooltip ────────────────────────────────────────────────────────
    const handleLikeHoverEnter = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (tooltipTimeout.current) clearTimeout(tooltipTimeout.current);
        setShowTooltip(true);

        if (likers.length === 0 && likes > 0) {
            setLoadingLikers(true);
            try {
                const res = await fetch(`${API_URL}/api/components/${component.id}/likers`);
                const json = await res.json();
                if (json.success) setLikers(json.data);
            } catch { /* ignore */ }
            finally { setLoadingLikers(false); }
        }
    };

    const handleLikeHoverLeave = () => {
        tooltipTimeout.current = setTimeout(() => setShowTooltip(false), 200);
    };

    useEffect(() => () => {
        if (tooltipTimeout.current) clearTimeout(tooltipTimeout.current);
    }, []);

    // ── Copy ──────────────────────────────────────────────────────────────────
    const handleCopy = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        try {
            await navigator.clipboard.writeText(component.raw_code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch { /* ignore */ }
    };

    return (
        <Link
            href={`/components/${component.id}`}
            className="card group flex flex-col gap-3 p-4 hover:border-white/20 transition-all duration-200 block"
        >
            {/* Component Preview / Image placeholder */}
            <div className="h-40 bg-[#0A0A0C] border-b border-white/5 flex items-center justify-center relative overflow-hidden group-hover:bg-[#0f0f12] transition-colors rounded-t-xl">
                {component.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={component.image_url}
                        alt={`Preview of ${component.title}`}
                        className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                    />
                ) : (
                    <svg
                        className="w-8 h-8 text-white/10 group-hover:text-white/20 transition-colors"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1"
                    >
                        <path d="M12 2L2 12l10 10 10-10L12 2z" />
                    </svg>
                )}
            </div>

            {/* Meta */}
            <div className="flex-1 min-w-0 mt-1">
                <h3 className="text-hub-text text-sm font-semibold truncate group-hover:text-white transition-colors">
                    {component.title}
                </h3>
                {component.category && component.category !== 'uncategorized' && (
                    <span className="inline-block mt-1.5 text-[10px] font-medium px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20 capitalize">
                        {component.category.replace('-', ' ')}
                    </span>
                )}
                <p className="text-hub-muted text-xs mt-1.5 line-clamp-2 leading-relaxed">
                    {component.description}
                </p>
            </div>

            {/* Stats + Author */}
            <div className="flex items-center justify-between text-[11px] text-hub-muted mt-2 border-t border-hub-border pt-3">
                <div className="flex items-center gap-2">

                    {/* ── Like Button with Tooltip ─────────────────────────── */}
                    <div className="relative">
                        <button
                            onClick={handleLike}
                            onMouseEnter={handleLikeHoverEnter}
                            onMouseLeave={handleLikeHoverLeave}
                            title={userId ? 'Like this component' : 'Log in to like'}
                            className={`flex items-center gap-1 px-2 py-1 rounded-md transition-all duration-200 ${liked
                                ? 'text-rose-400 bg-rose-400/10 border border-rose-400/20'
                                : 'text-hub-muted hover:text-rose-400 hover:bg-rose-400/5 border border-transparent hover:border-rose-400/20'
                                } ${!userId ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                            <svg
                                className="w-3.5 h-3.5"
                                viewBox="0 0 24 24"
                                fill={liked ? 'currentColor' : 'none'}
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                            </svg>
                            <span className="font-semibold">{likes}</span>
                        </button>

                        {/* Likers Tooltip */}
                        {showTooltip && (
                            <div
                                onMouseEnter={() => { if (tooltipTimeout.current) clearTimeout(tooltipTimeout.current); }}
                                onMouseLeave={handleLikeHoverLeave}
                                className="absolute bottom-full left-0 mb-2 z-50 min-w-[120px] max-w-[200px] bg-[#1a1a1f] border border-white/15 rounded-lg px-3 py-2 shadow-xl pointer-events-auto"
                            >
                                <p className="text-[10px] font-semibold text-hub-muted uppercase tracking-wider mb-1.5">
                                    Liked by
                                </p>
                                {loadingLikers ? (
                                    <p className="text-xs text-hub-muted animate-pulse">Loading…</p>
                                ) : likers.length > 0 ? (
                                    <ul className="space-y-1">
                                        {likers.map((name, i) => (
                                            <li key={i} className="flex items-center gap-1.5 text-xs text-white">
                                                <div className="w-4 h-4 rounded-full bg-violet-600 flex items-center justify-center text-[8px] font-bold shrink-0">
                                                    {name[0]?.toUpperCase()}
                                                </div>
                                                {name}
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-xs text-hub-muted">No likes yet</p>
                                )}
                                {/* Tooltip arrow */}
                                <div className="absolute top-full left-4 w-2 h-2 bg-[#1a1a1f] border-r border-b border-white/15 rotate-45 -mt-1" />
                            </div>
                        )}
                    </div>

                    {/* ── Copy Button ──────────────────────────────────────── */}
                    <button
                        onClick={handleCopy}
                        title="Copy source code"
                        className={`flex items-center gap-1 px-2 py-1 rounded-md transition-all duration-200 border ${copied
                            ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20'
                            : 'text-hub-muted hover:text-white hover:bg-white/5 border-transparent hover:border-white/10'
                            }`}
                    >
                        {copied ? (
                            <>
                                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                                <span className="font-semibold">Copied!</span>
                            </>
                        ) : (
                            <>
                                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                                </svg>
                                <span className="font-semibold">Copy</span>
                            </>
                        )}
                    </button>
                </div>

                {/* Author Badge */}
                <span
                    className="inline-flex items-center gap-1 bg-white/5 border border-white/10 rounded-full px-2 py-0.5 text-[10px] font-medium text-hub-muted"
                    title={`Author: ${component.author_name ?? component.author_id}`}
                >
                    <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                    {component.author_name ?? component.author_id?.slice(0, 8)}
                </span>
            </div>
        </Link>
    );
}
