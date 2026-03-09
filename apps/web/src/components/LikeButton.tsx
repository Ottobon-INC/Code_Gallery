'use client';

import { useState, useRef } from 'react';
import { useSession } from 'next-auth/react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

interface Props {
    componentId: string;
    initialLikes: number;
}

export function LikeButton({ componentId, initialLikes }: Props) {
    const { data: session } = useSession();
    const userId = (session?.user as { id?: string })?.id;

    const [likes, setLikes] = useState(initialLikes);
    const [liked, setLiked] = useState(false);
    const [loading, setLoading] = useState(false);

    // Tooltip state
    const [likers, setLikers] = useState<string[]>([]);
    const [tooltipVisible, setTooltipVisible] = useState(false);
    const [tooltipLoading, setTooltipLoading] = useState(false);
    const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleLike = async () => {
        if (!userId || loading) return;
        setLoading(true);
        const wasLiked = liked;
        setLiked(!wasLiked);
        setLikes(p => wasLiked ? p - 1 : p + 1);
        try {
            const res = await fetch(`${API_URL}/api/components/${componentId}/like`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: userId }),
            });
            const json = await res.json();
            if (json.success) {
                setLiked(json.data.liked);
                setLikes(json.data.likes);
            } else {
                setLiked(wasLiked);
                setLikes(p => wasLiked ? p + 1 : p - 1);
            }
        } catch {
            setLiked(wasLiked);
            setLikes(p => wasLiked ? p + 1 : p - 1);
        } finally {
            setLoading(false);
        }
    };

    const handleMouseEnter = () => {
        hoverTimer.current = setTimeout(async () => {
            setTooltipVisible(true);
            if (likes === 0) return;
            setTooltipLoading(true);
            try {
                const res = await fetch(`${API_URL}/api/components/${componentId}/likers`);
                const json = await res.json();
                if (json.success) setLikers(json.data);
            } catch { /* ignore */ }
            finally { setTooltipLoading(false); }
        }, 300);
    };

    const handleMouseLeave = () => {
        if (hoverTimer.current) clearTimeout(hoverTimer.current);
        setTooltipVisible(false);
        setLikers([]);
    };

    return (
        <div className="relative inline-flex" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
            <button
                onClick={handleLike}
                disabled={!userId || loading}
                title={!userId ? 'Sign in to like' : undefined}
                className={`flex items-center gap-1.5 text-xs font-medium transition-all duration-150 disabled:cursor-not-allowed ${liked ? 'text-rose-400' : 'text-neutral-500 hover:text-rose-400'
                    }`}
            >
                <svg
                    className={`w-3.5 h-3.5 transition-transform duration-150 ${liked ? 'scale-110' : ''}`}
                    viewBox="0 0 24 24"
                    fill={liked ? 'currentColor' : 'none'}
                    stroke="currentColor"
                    strokeWidth="2"
                >
                    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                </svg>
                {likes} {likes === 1 ? 'like' : 'likes'}
            </button>

            {/* Hover tooltip */}
            {tooltipVisible && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 z-50 animate-in fade-in slide-in-from-bottom-1 duration-150">
                    <div className="bg-neutral-900 border border-white/10 rounded-lg shadow-xl px-3 py-2.5 min-w-[140px] max-w-[200px]">
                        {tooltipLoading ? (
                            <div className="flex items-center gap-2 text-neutral-500 text-[11px]">
                                <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                Loading...
                            </div>
                        ) : likers.length === 0 ? (
                            <p className="text-neutral-600 text-[11px] text-center">No likes yet</p>
                        ) : (
                            <>
                                <p className="text-[9px] font-semibold text-neutral-600 uppercase tracking-widest mb-1.5">Liked by</p>
                                <ul className="space-y-1">
                                    {likers.slice(0, 10).map((name, i) => (
                                        <li key={i} className="flex items-center gap-1.5">
                                            <span className="w-4 h-4 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center text-[8px] font-bold text-white shrink-0">
                                                {name.charAt(0).toUpperCase()}
                                            </span>
                                            <span className="text-[11px] text-neutral-300 truncate">{name}</span>
                                        </li>
                                    ))}
                                    {likers.length > 10 && (
                                        <li className="text-[10px] text-neutral-600 pt-0.5">
                                            +{likers.length - 10} more
                                        </li>
                                    )}
                                </ul>
                            </>
                        )}
                    </div>
                    {/* Arrow */}
                    <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0"
                        style={{ borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderTop: '5px solid rgba(255,255,255,0.1)' }} />
                </div>
            )}
        </div>
    );
}
