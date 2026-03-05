'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import type { SandpackTemplate } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

const STACKS: { id: SandpackTemplate; label: string; icon: string; color: string }[] = [
    { id: 'vite-react-ts', label: 'React · TS', icon: '⚛', color: 'text-sky-400 border-sky-400/30 bg-sky-400/5' },
    { id: 'vite-react', label: 'React · JS', icon: '⚛', color: 'text-yellow-400 border-yellow-400/30 bg-yellow-400/5' },
    { id: 'vue', label: 'Vue 3', icon: '💚', color: 'text-green-400 border-green-400/30 bg-green-400/5' },
    { id: 'svelte', label: 'Svelte', icon: '🔶', color: 'text-orange-400 border-orange-400/30 bg-orange-400/5' },
    { id: 'angular', label: 'Angular', icon: '🔺', color: 'text-red-400 border-red-400/30 bg-red-400/5' },
    { id: 'static', label: 'HTML/CSS', icon: '🌐', color: 'text-blue-400 border-blue-400/30 bg-blue-400/5' },
    { id: 'vanilla', label: 'Vanilla JS', icon: '🟨', color: 'text-yellow-300 border-yellow-300/30 bg-yellow-300/5' },
];

const CATEGORY_OPTIONS = [
    { id: 'forms', label: 'Forms' },
    { id: 'navigation', label: 'Navigation' },
    { id: 'data-display', label: 'Data Display' },
    { id: 'overlays', label: 'Overlays' },
    { id: 'feedback', label: 'Feedback' },
    { id: 'uncategorized', label: 'Uncategorized' },
];

interface Props {
    onSuccess?: () => void;
}

export function NewComponentModal({ onSuccess }: Props) {
    const { data: session } = useSession();
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
    const [selectedStack, setSelectedStack] = useState<SandpackTemplate>('vite-react-ts');
    const [selectedCategory, setSelectedCategory] = useState('uncategorized');

    const [form, setForm] = useState({
        title: '',
        description: '',
        raw_code: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
        setFieldErrors(prev => ({ ...prev, [e.target.name]: [] })); // clear field error on change
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setFieldErrors({});
        setLoading(true);

        try {
            const res = await fetch(`${API_URL}/api/components`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...form,
                    stack: selectedStack,
                    category: selectedCategory,
                    author_id: (session?.user as { id?: string })?.id,
                }),
            });

            const json = await res.json();

            if (!res.ok || !json.success) {
                // Surface field-level validation errors from the API
                if (json.details) {
                    setFieldErrors(json.details);
                } else {
                    setError(json.error ?? 'Something went wrong. Please try again.');
                }
                return;
            }

            // Success — reset and close
            setForm({ title: '', description: '', raw_code: '' });
            setSelectedStack('vite-react-ts');
            setSelectedCategory('uncategorized');
            setOpen(false);
            router.refresh(); // Server component re-fetch
            onSuccess?.();
        } catch (err) {
            setError('Could not reach the API. Is the backend server running on port 3000?');
            console.error('[NewComponentModal] Submit error:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* Trigger Button */}
            <button
                onClick={() => setOpen(true)}
                className="bg-white text-black text-xs font-semibold px-4 py-2.5 rounded-md hover:bg-gray-200 transition-colors"
            >
                + New Component
            </button>

            {/* Modal Overlay */}
            {open && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                    onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
                >
                    <div className="bg-[#0A0A0C] border border-white/10 rounded-xl w-full max-w-lg mx-4 p-6 shadow-2xl">
                        <div className="mb-5">
                            <h2 className="text-hub-text text-lg font-bold">Add Component to Registry</h2>
                            <p className="text-hub-muted text-xs mt-1">
                                Submit a reusable component. It will be searchable by the entire team via AI semantic search.
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Stack Picker */}
                            <div>
                                <label className="block text-xs font-semibold text-hub-muted mb-2">Framework / Stack *</label>
                                <div className="grid grid-cols-4 gap-1.5">
                                    {STACKS.map((s) => (
                                        <button
                                            key={s.id}
                                            type="button"
                                            onClick={() => setSelectedStack(s.id)}
                                            className={`flex flex-col items-center gap-1 px-2 py-2 rounded-md border text-xs font-medium transition-all ${selectedStack === s.id
                                                ? s.color + ' ring-1 ring-current'
                                                : 'border-hub-border text-hub-muted hover:border-white/20'
                                                }`}
                                        >
                                            <span className="text-base">{s.icon}</span>
                                            <span>{s.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Category Picker */}
                            <div>
                                <label className="block text-xs font-semibold text-hub-muted mb-1.5">Category *</label>
                                <select
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                    className="w-full bg-hub-surface border border-hub-border rounded-md px-3 py-2 text-hub-text text-sm focus:outline-none focus:border-white/30 transition-colors appearance-none cursor-pointer"
                                >
                                    {CATEGORY_OPTIONS.map(opt => (
                                        <option key={opt.id} value={opt.id}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                            {/* Title */}
                            <div>
                                <label className="block text-xs font-semibold text-hub-muted mb-1.5">Component Name *</label>
                                <input
                                    name="title"
                                    value={form.title}
                                    onChange={handleChange}
                                    placeholder="e.g. StripePaymentForm"
                                    className="w-full bg-hub-surface border border-hub-border rounded-md px-3 py-2 text-hub-text text-sm placeholder:text-hub-muted/50 focus:outline-none focus:border-white/30 transition-colors"
                                />
                                {fieldErrors.title && <p className="text-red-400 text-xs mt-1">{fieldErrors.title[0]}</p>}
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-xs font-semibold text-hub-muted mb-1.5">Description *</label>
                                <textarea
                                    name="description"
                                    value={form.description}
                                    onChange={handleChange}
                                    rows={2}
                                    placeholder="What does this component do? When should it be used?"
                                    className="w-full bg-hub-surface border border-hub-border rounded-md px-3 py-2 text-hub-text text-sm placeholder:text-hub-muted/50 focus:outline-none focus:border-white/30 transition-colors resize-none"
                                />
                                {fieldErrors.description && <p className="text-red-400 text-xs mt-1">{fieldErrors.description[0]}</p>}
                            </div>

                            {/* Code */}
                            <div>
                                <label className="block text-xs font-semibold text-hub-muted mb-1.5">Source Code *</label>
                                <textarea
                                    name="raw_code"
                                    value={form.raw_code}
                                    onChange={handleChange}
                                    rows={8}
                                    placeholder="// Paste your React/TypeScript component here..."
                                    className="w-full bg-hub-surface border border-hub-border rounded-md px-3 py-2 text-hub-text text-xs font-mono placeholder:text-hub-muted/50 focus:outline-none focus:border-white/30 transition-colors resize-y"
                                />
                                {fieldErrors.raw_code && <p className="text-red-400 text-xs mt-1">{fieldErrors.raw_code[0]}</p>}
                            </div>

                            {/* Global API error */}
                            {error && (
                                <div className="bg-red-500/10 border border-red-500/30 rounded-md px-3 py-2.5 text-red-400 text-xs">
                                    ⚠ {error}
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setOpen(false)}
                                    className="text-hub-muted text-xs px-4 py-2 rounded-md hover:text-hub-text transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="bg-white text-black text-xs font-semibold px-4 py-2 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {loading ? 'Submitting...' : 'Submit Component'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
