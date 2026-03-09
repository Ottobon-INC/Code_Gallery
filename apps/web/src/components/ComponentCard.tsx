'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Component } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';
const INTENT_DELAY = 400;
const EXPANDED_WIDTH = 560;
const EXPANDED_HEIGHT = 280;
const CODE_PREVIEW_LINES = 14;

interface ComponentCardProps {
    component: Component;
}

const SPRING = { type: 'spring', stiffness: 320, damping: 30, mass: 0.7 } as const;

// ─── Icons ────────────────────────────────────────────────────────────────────

const HeartIcon = ({ filled }: { filled: boolean }) => (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
    </svg>
);

const CopyIcon = () => (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
        <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
    </svg>
);

const CheckIcon = () => (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
    </svg>
);

const UserIcon = () => (
    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
        <circle cx="12" cy="7" r="4" />
    </svg>
);

const ArrowIcon = () => (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
);

// ─── Syntax Highlighter ───────────────────────────────────────────────────────

function highlight(line: string): React.ReactNode[] {
    const segments: React.ReactNode[] = [];
    let remaining = line;
    let k = 0;

    const eat = (re: RegExp, cls: string) => {
        const m = remaining.match(re);
        if (!m || m.index === undefined) return false;
        if (m.index > 0) segments.push(<span key={k++}>{remaining.slice(0, m.index)}</span>);
        segments.push(<span key={k++} className={cls}>{m[0]}</span>);
        remaining = remaining.slice(m.index + m[0].length);
        return true;
    };

    while (remaining.length > 0) {
        if (/^\/\//.test(remaining)) { segments.push(<span key={k++} className="text-[#6a9955]">{remaining}</span>); break; }
        if (eat(/^<\/?[A-Z][A-Za-z0-9]*|^<\/?[a-z][a-z0-9-]*/, 'text-[#4ec9b0]')) continue;
        if (eat(/^(['"])(?:(?!\1).|\\.)*\1/, 'text-[#ce9178]')) continue;
        if (eat(/^`[^`]*`/, 'text-[#ce9178]')) continue;
        if (eat(/^\b(import|export|from|const|let|var|function|return|if|else|async|await|type|interface|extends|default|class|new|true|false|null|undefined|void|=>)\b/, 'text-[#569cd6]')) continue;
        if (eat(/^\b(React|useState|useEffect|useRef|useCallback|useMemo|Props)\b/, 'text-[#9cdcfe]')) continue;
        if (eat(/^\b\d+(\.\d+)?\b/, 'text-[#b5cea8]')) continue;
        if (eat(/^[{};:,()[\]<>=+!&|?./%]/, 'text-[#808080]')) continue;
        segments.push(<span key={k++}>{remaining[0]}</span>);
        remaining = remaining.slice(1);
    }
    return segments;
}

function CodePreview({ code }: { code: string }) {
    const lines = code.split('\n').slice(0, CODE_PREVIEW_LINES);
    const total = code.split('\n').length;
    const hidden = Math.max(0, total - CODE_PREVIEW_LINES);

    return (
        <div className="flex flex-col h-full rounded-lg overflow-hidden ring-1 ring-inset ring-white/[0.08]">
            <div className="flex items-center gap-1.5 px-3 py-2 bg-neutral-950 border-b border-white/[0.06] shrink-0">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                <span className="ml-2 text-[10px] text-neutral-500 font-mono">Component.tsx</span>
                {hidden > 0 && <span className="ml-auto text-[9px] text-neutral-600 font-mono">+{hidden} lines</span>}
            </div>
            <div className="flex-1 bg-neutral-950 overflow-hidden relative">
                <pre className="h-full text-[10.5px] leading-[1.65] overflow-hidden"
                    style={{ fontFamily: "'JetBrains Mono','Fira Code','Consolas',monospace" }}>
                    <table className="w-full border-collapse">
                        <tbody>
                            {lines.map((line, i) => (
                                <tr key={i} className="group hover:bg-white/[0.02]">
                                    <td className="select-none text-right pr-3 pl-2 text-neutral-700 group-hover:text-neutral-500 transition-colors"
                                        style={{ minWidth: '32px', verticalAlign: 'top', paddingTop: '1px' }}>
                                        {i + 1}
                                    </td>
                                    <td className="pr-3 text-neutral-300 whitespace-pre"
                                        style={{ verticalAlign: 'top', paddingTop: '1px' }}>
                                        {highlight(line)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </pre>
                <div className="absolute bottom-0 inset-x-0 h-10 bg-gradient-to-t from-neutral-950 to-transparent pointer-events-none" />
            </div>
        </div>
    );
}

// ─── Right panel: component metadata ─────────────────────────────────────────
function RightPanel({ component }: { component: Component }) {
    return (
        <div className="flex flex-col gap-3 h-full overflow-y-auto pr-0.5">
            {/* Description */}
            {component.description && (
                <div>
                    <p className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest mb-1">About</p>
                    <p className="text-[11px] text-neutral-300 leading-relaxed line-clamp-4">
                        {component.description}
                    </p>
                </div>
            )}

            {/* Stack */}
            <div>
                <p className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest mb-1">Stack</p>
                <span className="inline-block px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 text-[10px] font-medium ring-1 ring-inset ring-indigo-500/20 uppercase tracking-wide">
                    {component.stack ?? 'React · TS'}
                </span>
            </div>

            {/* Author */}
            {component.author_name && (
                <div>
                    <p className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest mb-1">Author</p>
                    <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-400 flex items-center justify-center text-[9px] font-bold text-white shrink-0">
                            {component.author_name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-[11px] text-neutral-200 truncate">{component.author_name}</span>
                    </div>
                </div>
            )}

            {/* Usage */}
            <div>
                <p className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest mb-1">Usage</p>
                <p className="text-[11px] text-neutral-300">
                    <span className="text-neutral-100 font-semibold">{component.usage_count ?? 0}</span> injection{component.usage_count !== 1 ? 's' : ''}
                </p>
            </div>
        </div>
    );
}

// ─── Wide expanded overlay ────────────────────────────────────────────────────
function ExpandedCard({
    component, likes, liked, copied, expandUp,
    onLike, onCopy, rect, originX, onMouseEnter, onMouseLeave,
}: {
    component: Component; likes: number; liked: boolean; copied: boolean; expandUp: boolean;
    onLike: (e: React.MouseEvent) => void; onCopy: (e: React.MouseEvent) => void;
    rect: DOMRect; originX: number; onMouseEnter: () => void; onMouseLeave: () => void;
}) {
    // Vertical anchor
    const topStyle = expandUp
        ? rect.top + window.scrollY - EXPANDED_HEIGHT + rect.height + 8
        : rect.top + window.scrollY - 8;
    const yFrom = expandUp ? -6 : 6;

    const [likers, setLikers] = useState<string[]>([]);
    const [tipVisible, setTipVisible] = useState(false);
    const [tipLoading, setTipLoading] = useState(false);
    const tipTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleLikeMouseEnter = () => {
        tipTimer.current = setTimeout(async () => {
            setTipVisible(true);
            if (likes === 0) return;
            setTipLoading(true);
            try {
                const res = await fetch(`${API_URL}/api/components/${component.id}/likers`);
                const json = await res.json();
                if (json.success) setLikers(json.data);
            } catch { /* ignore */ }
            finally { setTipLoading(false); }
        }, 300);
    };

    const handleLikeMouseLeave = () => {
        if (tipTimer.current) clearTimeout(tipTimer.current);
        setTipVisible(false);
        setLikers([]);
    };

    return (
        <motion.div
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            className="fixed z-[9999] rounded-xl ring-1 ring-inset ring-white/[0.12] shadow-[0_32px_80px_rgba(0,0,0,0.95),0_0_0_1px_rgba(255,255,255,0.04)] w-[calc(100vw-32px)] md:w-[560px]"
            style={{
                top: topStyle,
                left: originX + window.scrollX,
                background: '#141414',
            }}
            initial={{ opacity: 0, scale: 0.97, y: yFrom }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: yFrom, transition: { duration: 0.14 } }}
            transition={SPRING}
        >
            {/* Top bar - Ensure relative for tooltip positioning */}
            <div className="relative flex items-center gap-3 px-4 py-3 border-b border-white/[0.07] bg-neutral-900/60 rounded-t-xl">
                <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-neutral-100 tracking-tight truncate">{component.title}</h3>
                    {component.category && component.category !== 'uncategorized' && (
                        <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 text-[9px] font-medium uppercase tracking-wider ring-1 ring-inset ring-indigo-500/20 capitalize">
                            {component.category.replace('-', ' ')}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <div
                        className="relative"
                        onMouseEnter={handleLikeMouseEnter}
                        onMouseLeave={handleLikeMouseLeave}
                    >
                        <button onClick={onLike}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-150 ${liked ? 'text-rose-400 bg-rose-400/10 border-rose-500/30'
                                : 'text-neutral-400 bg-neutral-800/60 border-white/10 hover:border-white/25 hover:text-neutral-200'
                                }`}>
                            <HeartIcon filled={liked} /><span>{likes}</span>
                        </button>

                        {/* Likers tooltip - Updated positioning and z-index */}
                        <AnimatePresence>
                            {tipVisible && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, x: '-50%' }}
                                    animate={{ opacity: 1, y: 0, x: '-50%' }}
                                    exit={{ opacity: 0, y: 5, x: '-50%' }}
                                    className="absolute bottom-full left-1/2 mb-3 z-[10001]"
                                >
                                    <div className="bg-[#1a1a1a] border border-white/10 rounded-lg shadow-2xl px-3 py-2.5 min-w-[140px] max-w-[200px]">
                                        {tipLoading ? (
                                            <div className="flex items-center justify-center py-1">
                                                <svg className="w-3.5 h-3.5 animate-spin text-neutral-500" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                                </svg>
                                            </div>
                                        ) : likers.length === 0 ? (
                                            <p className="text-neutral-500 text-[10px] text-center">No likes yet</p>
                                        ) : (
                                            <>
                                                <p className="text-[8px] font-bold text-neutral-500 uppercase tracking-widest mb-2">Liked by</p>
                                                <ul className="space-y-1.5">
                                                    {likers.slice(0, 5).map((name, i) => (
                                                        <li key={i} className="flex items-center gap-2">
                                                            <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-rose-500 to-orange-400 flex items-center justify-center text-[8px] font-bold text-white shrink-0">
                                                                {name.charAt(0).toUpperCase()}
                                                            </div>
                                                            <span className="text-[11px] text-neutral-200 truncate">{name}</span>
                                                        </li>
                                                    ))}
                                                    {likers.length > 5 && (
                                                        <li className="text-[9px] text-neutral-500 pl-6">+{likers.length - 5} others</li>
                                                    )}
                                                </ul>
                                            </>
                                        )}
                                    </div>
                                    {/* Arrow */}
                                    <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-white/10" />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                    <button onClick={onCopy}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-150 ${copied ? 'text-emerald-400 bg-emerald-400/10 border-emerald-500/30'
                            : 'text-neutral-400 bg-neutral-800/60 border-white/10 hover:border-white/25 hover:text-neutral-200'
                            }`}>
                        {copied ? <CheckIcon /> : <CopyIcon />}<span>{copied ? 'Copied!' : 'Copy'}</span>
                    </button>
                    <Link href={`/components/${component.id}`} onClick={e => e.stopPropagation()}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-neutral-100 text-neutral-900 hover:bg-white ring-1 ring-inset ring-white/20 transition-all duration-150">
                        View <ArrowIcon />
                    </Link>
                </div>
            </div>

            {/* Body */}
            <div className="flex flex-col md:flex-row rounded-b-xl overflow-hidden md:h-[220px]">
                <div className="flex-1 min-w-0 p-3 md:pr-1.5 h-[200px] md:h-auto">
                    <CodePreview code={component.raw_code} />
                </div>
                <div className="hidden md:block w-px bg-white/[0.05] shrink-0 my-3" />
                <div className="md:w-[44%] shrink-0 p-3 md:pl-1.5 border-t border-white/[0.05] md:border-t-0 bg-neutral-900/40 md:bg-transparent max-h-[160px] md:max-h-none overflow-y-auto">
                    <RightPanel component={component} />
                </div>
            </div>
        </motion.div>
    );
}

// ─── Normal card ─────────────────────────────────────────────────────────────
function CardBody({ component, liked, likes }: { component: Component; liked: boolean; likes: number }) {
    return (
        <div className="rounded-xl overflow-hidden flex flex-col bg-neutral-900/50 ring-1 ring-inset ring-white/10 transition-all duration-200 hover:bg-neutral-900/80 hover:ring-white/20">
            {/* Thumbnail — full bleed, no padding */}
            <div className="h-40 w-full bg-neutral-800/50 flex items-center justify-center border-b border-white/5 overflow-hidden">
                {component.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={component.image_url} alt={component.title} draggable={false}
                        className="w-full h-full object-cover" />
                ) : (
                    <svg className="w-7 h-7 text-neutral-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                        <path d="M12 2L2 12l10 10 10-10L12 2z" />
                    </svg>
                )}
            </div>

            {/* Content */}
            <div className="p-4 flex flex-col flex-grow">
                {/* Title + Badge row */}
                <div className="flex justify-between items-start gap-2 mb-1.5 flex-wrap sm:flex-nowrap">
                    <h3 className="text-sm font-semibold text-neutral-100 tracking-tight truncate max-w-full">
                        {component.title}
                    </h3>
                    {component.category && component.category !== 'uncategorized' && (
                        <span className="shrink-0 px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 text-[10px] font-medium uppercase tracking-wider ring-1 ring-inset ring-indigo-500/20">
                            {component.category.replace('-', ' ')}
                        </span>
                    )}
                </div>

                {/* Description */}
                <p className="text-xs text-neutral-400 leading-relaxed line-clamp-2 mb-4">
                    {component.description}
                </p>

                {/* Footer */}
                <div className="mt-auto pt-3 border-t border-white/5 flex items-center justify-between gap-y-2 flex-wrap sm:flex-nowrap min-w-0">
                    <div className="flex items-center gap-3 text-neutral-500 text-xs font-medium shrink-0">
                        <button className={`flex items-center gap-1 transition-colors ${liked ? 'text-rose-400' : 'hover:text-neutral-200'}`}>
                            <HeartIcon filled={liked} />
                            <span>{likes}</span>
                        </button>
                        <button className="flex items-center gap-1 hover:text-neutral-200 transition-colors">
                            <CopyIcon />
                            <span className="hidden sm:inline">Copy</span>
                        </button>
                    </div>
                    <span className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/5 ring-1 ring-inset ring-white/10 text-[10px] text-neutral-300 font-medium max-w-full truncate min-w-0">
                        <UserIcon />
                        <span className="truncate">{component.author_name ?? component.author_id?.slice(0, 8)}</span>
                    </span>
                </div>
            </div>
        </div>
    );
}

// ─── Main ComponentCard ───────────────────────────────────────────────────────
export function ComponentCard({ component }: ComponentCardProps) {
    const { data: session } = useSession();
    const userId = (session?.user as { id?: string })?.id;

    const [likes, setLikes] = useState(component.likes);
    const [liked, setLiked] = useState(!!component.user_liked);
    const [copied, setCopied] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [rect, setRect] = useState<DOMRect | null>(null);
    const [originX, setOriginX] = useState(0);
    const [expandUp, setExpandUp] = useState(false);

    const wrapperRef = useRef<HTMLDivElement>(null);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const startExpand = useCallback(() => {
        if (!wrapperRef.current) return;
        const r = wrapperRef.current.getBoundingClientRect();
        setRect(r);

        const isMobile = window.innerWidth < 768;
        const width = isMobile ? window.innerWidth - 32 : EXPANDED_WIDTH;
        const heightAssumed = isMobile ? 420 : 300;

        const ideal = r.left + r.width / 2 - width / 2;
        setOriginX(Math.min(Math.max(ideal, 16), window.innerWidth - width - 16));

        const spaceBelow = window.innerHeight - r.bottom;
        setExpandUp(spaceBelow < heightAssumed && r.top > heightAssumed);

        setIsExpanded(true);
    }, []);

    const handleMouseEnter = useCallback(() => {
        timerRef.current = setTimeout(startExpand, INTENT_DELAY);
    }, [startExpand]);

    const handleMouseLeave = useCallback(() => {
        if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
        setIsExpanded(false);
    }, []);

    useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

    const handleLike = async (e: React.MouseEvent) => {
        e.preventDefault(); e.stopPropagation();
        if (!userId) return;
        const wasLiked = liked;
        setLiked(!wasLiked);
        setLikes(p => wasLiked ? p - 1 : p + 1);
        try {
            const res = await fetch(`${API_URL}/api/components/${component.id}/like`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: userId }),
            });
            const json = await res.json();
            if (json.success) { setLiked(json.data.liked); setLikes(json.data.likes); }
            else { setLiked(wasLiked); setLikes(p => wasLiked ? p + 1 : p - 1); }
        } catch { setLiked(wasLiked); setLikes(p => wasLiked ? p + 1 : p - 1); }
    };

    const handleCopy = async (e: React.MouseEvent) => {
        e.preventDefault(); e.stopPropagation();
        try {
            await navigator.clipboard.writeText(component.raw_code);
            setCopied(true); setTimeout(() => setCopied(false), 2000);
        } catch { /* ignore */ }
    };

    return (
        <>
            <Link
                href={`/components/${component.id}`}
                className={`block transition-opacity duration-200 ${isExpanded ? 'opacity-30' : 'opacity-100'}`}
                tabIndex={isExpanded ? -1 : 0}
            >
                <div ref={wrapperRef} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
                    <CardBody component={component} liked={liked} likes={likes} />
                </div>
            </Link>

            <AnimatePresence>
                {isExpanded && rect && (
                    <ExpandedCard
                        component={component} likes={likes} liked={liked} copied={copied} expandUp={expandUp}
                        onLike={handleLike} onCopy={handleCopy}
                        rect={rect} originX={originX}
                        onMouseEnter={() => { if (timerRef.current) clearTimeout(timerRef.current); setIsExpanded(true); }}
                        onMouseLeave={handleMouseLeave}
                    />
                )}
            </AnimatePresence>
        </>
    );
}