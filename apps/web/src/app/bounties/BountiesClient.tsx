'use client';

import { useState } from 'react';
import type { Bounty } from '@/types';
import { api } from '@/lib/api';
import { BountyBoard } from '@/components/BountyBoard';

export function BountiesClient({ initialBounties }: { initialBounties: Bounty[] }) {
    const [bounties, setBounties] = useState<Bounty[]>(initialBounties);
    const [showForm, setShowForm] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;
        setSubmitting(true);
        try {
            const newBounty = await api.bounties.create({ title, description, requested_by: 'anonymous' });
            setBounties((prev) => [newBounty, ...prev]);
            setTitle(''); setDescription(''); setShowForm(false);
        } catch { /* empty */ }
        finally { setSubmitting(false); }
    };

    return (
        <>
            <div className="flex items-end justify-between mb-8">
                <div>
                    <h1 className="text-white text-2xl font-bold tracking-tight mb-2">Bounty Board</h1>
                    <p className="text-hub-muted text-sm">Request components, claim tickets, and earn recognition across the engineering org.</p>
                </div>
                <button
                    onClick={() => setShowForm((s) => !s)}
                    className="bg-white text-black px-4 py-2.5 rounded-md text-xs font-semibold hover:bg-gray-200 transition-colors"
                >
                    {showForm ? 'Cancel Request' : '+ Post Bounty Request'}
                </button>
            </div>

            {showForm && (
                <form onSubmit={handleSubmit} className="card p-6 mb-8 space-y-4 animate-slide-up border-white/20">
                    <h2 className="text-white text-sm font-semibold">Create Request</h2>
                    <div className="space-y-3">
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Component name (e.g. Stripe Checkout Modal)"
                            required
                            className="w-full bg-[#000000] border border-hub-border rounded-md px-4 py-2.5 text-white text-sm placeholder:text-hub-muted outline-none focus:border-white/50 transition-colors"
                        />
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Describe what you need and any API requirements..."
                            rows={3}
                            className="w-full bg-[#000000] border border-hub-border rounded-md px-4 py-2.5 text-white text-sm placeholder:text-hub-muted outline-none focus:border-white/50 resize-none transition-colors"
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={() => setShowForm(false)}
                            className="px-4 py-2 rounded-md text-xs text-hub-muted hover:text-white transition-colors font-medium border border-transparent hover:border-hub-border"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="px-6 py-2 rounded-md bg-white text-black text-xs font-semibold hover:bg-gray-200 disabled:opacity-50 transition-colors"
                        >
                            {submitting ? 'Posting…' : 'Submit'}
                        </button>
                    </div>
                </form>
            )}

            <BountyBoard initialBounties={bounties} />
        </>
    );
}
