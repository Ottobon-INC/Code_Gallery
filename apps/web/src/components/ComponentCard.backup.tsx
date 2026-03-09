'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Component } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';
const INTENT_DELAY = 400;
const EXPANDED_WIDTH = 560;
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

// ─── Right panel of the hover overlay ────────────────────────────────────────

function RightPanel({ component }: { component: Component }) {
    return (
        <div className="flex flex-col h-full gap-3">
            <div className="relative rounded-lg overflow-hidden bg-neutral-800/50 ring-1 ring-inset ring-white/[0.07]"
                style={{ aspectRatio: '16/10' }}>
                {component.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={component.image_url} alt={component.title} draggable={false} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                        <svg className="w-7 h-7 text-neutral-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                            <path d="M12 2L2 12l10 10 10-10L12 2z" />
                        </svg>
                        <span className="text-[9px] text-neutral-600 font-mono">No preview</span>
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                {component.stack && (
                    <span className="absolute bottom-2 right-2 text-[9px] border border-white/20 bg-black/60 text-neutral-300 px-1.5 py-0.5 rounded font-mono uppercase">
                        {component.stack}
                    </span>
                )}
            </div>

            <p className="text-neutral-400 text-[11px] leading-relaxed line-clamp-3 flex-1">
                {component.description || 'No description provided.'}
            </p>

            <div className="flex items-center gap-1.5 text-[10px] text-neutral-600 border-t border-white/[0.06] pt-2">
                <UserIcon />
                <span className="text-neutral-500">{component.author_name ?? component.author_id?.slice(0, 8)}</span>
            </div>
        </div>
    );
}

// ─── Wide expanded overlay ────────────────────────────────────────────────────

function ExpandedCard({
    component, likes, liked, copied,
    onLike, onCopy, rect, originX, onMouseEnter, onMouseLeave,
}: {
    component: Component; likes: number; liked: boolean; copied: boolean;
    onLike: (e: React.MouseEvent) => void; onCopy: (e: React.MouseEvent) => void;
    rect: DOMRect; originX: number; onMouseEnter: () => void; onMouseLeave: () => void;
}) {
    return (
        <motion.div
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            className="fixed z-[9999] rounded-xl overflow-hidden ring-1 ring-inset ring-white/[0.12] shadow-[0_32px_80px_rgba(0,0,0,0.95),0_0_0_1px_rgba(255,255,255,0.04)]"
            style={{
                top: rect.top + window.scrollY - 8,
                left: originX + window.scrollX,
                width: EXPANDED_WIDTH,
                background: '#141414',
            }}
            initial={{ opacity: 0, scale: 0.97, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 6, transition: { duration: 0.14 } }}
            transition={SPRING}
        >
            {/* Top bar */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.07] bg-neutral-900/60">
                <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-neutral-100 tracking-tight truncate">{component.title}</h3>
                    {component.category && component.category !== 'uncategorized' && (
                        <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 text-[9px] font-medium uppercase tracking-wider ring-1 ring-inset ring-indigo-500/20 capitalize">
                            {component.category.replace('-', ' ')}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <button onClick={onLike}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-150 ${liked ? 'text-rose-400 bg-rose-400/10 border-rose-500/30'
                                : 'text-neutral-400 bg-neutral-800/60 border-white/10 hover:border-white/25 hover:text-neutral-200'
                            }`}>
                        <HeartIcon filled={liked} /><span>{likes}</span>
                    </button>
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

            {/* Two-panel body */}
            <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="overflow-hidden"
            >
                <div className="flex" style={{ height: '220px' }}>
                    <div className="flex-1 min-w-0 p-3 pr-1.5">
                        <CodePreview code={component.raw_code} />
                    </div>
                    <div className="w-px bg-white/[0.05] shrink-0 my-3" />
                    <div className="w-[44%] shrink-0 p-3 pl-1.5">
                        <RightPanel component={component} />
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}

// ─── Normal card ─────────────────────────────────────────────────────────────

function CardBody({ component }: { component: Component }) {
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
                <div className="flex justify-between items-start gap-2 mb-1.5">
                    <h3 className="text-sm font-semibold text-neutral-100 tracking-tight truncate">
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
                <div className="mt-auto pt-3 border-t border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3 text-neutral-500 text-xs font-medium">
                        <button className="flex items-center gap-1 hover:text-neutral-200 transition-colors">
                            <HeartIcon filled={false} />
                            <span>{component.likes}</span>
                        </button>
                        <button className="flex items-center gap-1 hover:text-neutral-200 transition-colors">
                            <CopyIcon />
                            <span>Copy</span>
                        </button>
                    </div>
                    <span className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/5 ring-1 ring-inset ring-white/10 text-[10px] text-neutral-300 font-medium">
                        <UserIcon />
                        {component.author_name ?? component.author_id?.slice(0, 8)}
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
    const [liked, setLiked] = useState(false);
    const [copied, setCopied] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [rect, setRect] = useState<DOMRect | null>(null);
    const [originX, setOriginX] = useState(0);

    const wrapperRef = useRef<HTMLDivElement>(null);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const startExpand = useCallback(() => {
        if (!wrapperRef.current) return;
        const r = wrapperRef.current.getBoundingClientRect();
        setRect(r);
        const ideal = r.left + r.width / 2 - EXPANDED_WIDTH / 2;
        setOriginX(Math.min(Math.max(ideal, 12), window.innerWidth - EXPANDED_WIDTH - 12));
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
                    <CardBody component={component} />
                </div>
            </Link>

            <AnimatePresence>
                {isExpanded && rect && (
                    <ExpandedCard
                        component={component} likes={likes} liked={liked} copied={copied}
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
