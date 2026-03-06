'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { LogOut, Plus } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

interface CategoryItem {
    id: string;
    label: string;
    icon: string;
}

const BROWSE_ITEMS = [
    { label: 'All Components', id: 'all', icon: '❖' },
];


interface SidebarProps {
    activeCategory?: string;
    onCategoryChange?: (cat: string) => void;
    categories?: CategoryItem[];
    onCategoriesChanged?: () => void;
}

export function Sidebar({
    activeCategory = 'all',
    onCategoryChange,
    categories = [],
    onCategoriesChanged,
}: SidebarProps) {
    const pathname = usePathname();
    const { data: session } = useSession();

    const [addingCategory, setAddingCategory] = useState(false);
    const [newCategoryLabel, setNewCategoryLabel] = useState('');
    const [addError, setAddError] = useState<string | null>(null);
    const [adding, setAdding] = useState(false);

    const handleCategoryClick = (id: string) => {
        onCategoryChange?.(id);
    };

    const handleAddCategory = async () => {
        if (!newCategoryLabel.trim()) return;
        setAddError(null);
        setAdding(true);

        try {
            const res = await fetch(`${API_URL}/api/categories`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ label: newCategoryLabel.trim() }),
            });
            const json = await res.json();
            if (json.success) {
                setNewCategoryLabel('');
                setAddingCategory(false);
                onCategoriesChanged?.(); // re-fetch the list
            } else {
                setAddError(json.error ?? 'Failed to create category');
            }
        } catch {
            setAddError('Could not reach the API');
        } finally {
            setAdding(false);
        }
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

                {/* Dynamic Categories */}
                <div>
                    <div className="flex items-center justify-between px-3 mb-2">
                        <h3 className="text-[10px] font-semibold text-hub-muted uppercase tracking-widest">
                            Categories
                        </h3>
                        <button
                            onClick={() => { setAddingCategory(!addingCategory); setAddError(null); }}
                            title="Add new category"
                            className="text-hub-muted hover:text-white transition-colors p-0.5 rounded hover:bg-white/10"
                        >
                            <Plus className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    {/* Add Category Form */}
                    {addingCategory && (
                        <div className="mx-3 mb-2 space-y-1.5">
                            <input
                                value={newCategoryLabel}
                                onChange={e => { setNewCategoryLabel(e.target.value); setAddError(null); }}
                                onKeyDown={e => { if (e.key === 'Enter') handleAddCategory(); if (e.key === 'Escape') setAddingCategory(false); }}
                                placeholder="Category name..."
                                autoFocus
                                className="w-full bg-hub-bg border border-hub-border rounded-md px-2.5 py-1.5 text-xs text-hub-text placeholder:text-hub-muted/50 focus:outline-none focus:border-white/30"
                            />
                            <div className="flex items-center gap-1.5">
                                <button
                                    onClick={handleAddCategory}
                                    disabled={adding || !newCategoryLabel.trim()}
                                    className="flex-1 bg-white text-black text-[10px] font-semibold py-1 rounded-md hover:bg-gray-200 disabled:opacity-50 transition-colors"
                                >
                                    {adding ? 'Adding...' : 'Add'}
                                </button>
                                <button
                                    onClick={() => setAddingCategory(false)}
                                    className="text-hub-muted text-[10px] px-2 py-1 rounded-md hover:text-white transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                            {addError && <p className="text-red-400 text-[10px]">{addError}</p>}
                        </div>
                    )}

                    <div className="space-y-0.5">
                        {categories.map(item => {
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
                        {categories.length === 0 && (
                            <p className="text-hub-muted text-[10px] px-3 py-2">No categories yet</p>
                        )}
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
