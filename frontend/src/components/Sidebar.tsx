'use client';

import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { LogOut } from 'lucide-react';

const BROWSE_ITEMS = [
    { label: 'All Components', id: 'all', icon: '❖' },
    { label: 'Analytics', id: '_analytics', href: '/analytics', icon: '◱' },
    { label: 'Bounty Board', id: '_bounties', href: '/bounties', icon: '◎' },
];

const CATEGORY_ITEMS = [
    { label: 'Forms', id: 'forms', icon: '▣' },
    { label: 'Navigation', id: 'navigation', icon: '▷' },
    { label: 'Data Display', id: 'data-display', icon: '▤' },
    { label: 'Overlays', id: 'overlays', icon: '◫' },
    { label: 'Feedback', id: 'feedback', icon: '◌' },
];

interface SidebarProps {
    activeCategory?: string;
    onCategoryChange?: (cat: string) => void;
}

export function Sidebar({ activeCategory = 'all', onCategoryChange }: SidebarProps) {
    const pathname = usePathname();
    const { data: session } = useSession();

    const handleCategoryClick = (id: string) => {
        onCategoryChange?.(id);
    };

    return (
        <aside className="w-64 flex-shrink-0 bg-hub-surface border-r border-hub-border flex flex-col h-screen sticky top-0">
            {/* Header */}
            <div className="h-14 flex items-center px-6 border-b border-hub-border">
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                    <span className="text-hub-text text-sm font-semibold tracking-tight">ottobon<span className="text-hub-muted">hub</span></span>
                </div>
            </div>

            {/* Global Search Hint */}
            <div className="px-4 py-4">
                <div
                    onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }))}
                    className="flex items-center justify-between px-3 py-2 rounded-md bg-hub-bg border border-hub-border cursor-pointer hover:border-white/20 transition-colors"
                >
                    <div className="flex items-center gap-2 text-hub-muted">
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                        <span className="text-xs">Search...</span>
                    </div>
                    <kbd className="text-[10px] text-hub-muted font-mono bg-hub-surface px-1.5 py-0.5 rounded border border-hub-border">⌘K</kbd>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto px-4 pb-6 space-y-6">
                {/* Browse */}
                <div>
                    <h3 className="px-3 text-[10px] font-semibold text-hub-muted uppercase tracking-widest mb-2">
                        Browse
                    </h3>
                    <div className="space-y-0.5">
                        {BROWSE_ITEMS.map(item => {
                            const isActive = item.href
                                ? pathname.startsWith(item.href)
                                : activeCategory === item.id;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => item.href ? window.location.href = item.href : handleCategoryClick(item.id)}
                                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition-colors text-left ${isActive
                                            ? 'bg-hub-border text-hub-text'
                                            : 'text-hub-muted hover:text-hub-text hover:bg-white/5'
                                        }`}
                                >
                                    <span className={`text-[10px] ${isActive ? 'text-blue-400' : 'text-hub-muted'}`}>
                                        {item.icon}
                                    </span>
                                    {item.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Categories */}
                <div>
                    <h3 className="px-3 text-[10px] font-semibold text-hub-muted uppercase tracking-widest mb-2">
                        Categories
                    </h3>
                    <div className="space-y-0.5">
                        {CATEGORY_ITEMS.map(item => {
                            const isActive = activeCategory === item.id;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => handleCategoryClick(item.id)}
                                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition-colors text-left ${isActive
                                            ? 'bg-hub-border text-hub-text'
                                            : 'text-hub-muted hover:text-hub-text hover:bg-white/5'
                                        }`}
                                >
                                    <span className={`text-[10px] ${isActive ? 'text-blue-400' : 'text-hub-muted'}`}>
                                        {item.icon}
                                    </span>
                                    {item.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Secure Admin Route */}
                {session?.user?.is_admin && (
                    <div>
                        <h3 className="px-3 text-[10px] font-semibold text-hub-muted uppercase tracking-widest mb-2">
                            Secure Area
                        </h3>
                        <button
                            onClick={() => window.location.href = '/admin'}
                            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition-colors text-left ${pathname.startsWith('/admin') ? 'bg-red-500/10 text-red-500' : 'text-red-400 hover:bg-red-500/10'
                                }`}
                        >
                            <span className="text-[10px]">🔒</span>
                            Admin Dashboard
                        </button>
                    </div>
                )}
            </nav>

            {/* Footer / User */}
            <div className="p-4 border-t border-hub-border space-y-2">
                {/* User info */}
                <div className="flex items-center gap-3 px-1">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-violet-600 to-blue-500 flex items-center justify-center font-bold text-xs text-white uppercase shrink-0">
                        {(session?.user as { name?: string })?.name?.charAt(0)
                            ?? session?.user?.email?.substring(0, 2)
                            ?? 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-hub-text truncate">
                            {(session?.user as { name?: string })?.name ?? session?.user?.email?.split('@')[0] ?? 'User'}
                        </p>
                        <p className="text-[10px] text-hub-muted truncate">
                            {session?.user?.email}
                        </p>
                    </div>
                </div>

                {/* Sign out button */}
                <button
                    onClick={() => signOut({ callbackUrl: '/login' })}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium text-hub-muted hover:text-red-400 hover:bg-red-400/5 border border-transparent hover:border-red-400/20 transition-all duration-200 group"
                >
                    <LogOut className="w-3.5 h-3.5 group-hover:text-red-400 transition-colors" />
                    Sign out
                </button>
            </div>
        </aside>
    );
}
