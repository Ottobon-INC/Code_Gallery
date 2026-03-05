'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { CheckCircle2, User, Loader2 } from 'lucide-react';

interface PendingUser {
    id: string;
    email: string;
    created_at: string;
}

export default function AdminDashboard() {
    const { data: session } = useSession();
    const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [approvingId, setApprovingId] = useState<string | null>(null);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

    const fetchPendingUsers = async () => {
        try {
            const res = await fetch(`${API_URL}/api/auth/users/pending`);
            const json = await res.json();
            if (json.success) {
                setPendingUsers(json.data);
            }
        } catch (error) {
            console.error('Failed to fetch pending users:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (session?.user?.is_admin) {
            fetchPendingUsers();
        }
    }, [session]);

    const handleApprove = async (userId: string) => {
        setApprovingId(userId);
        try {
            const res = await fetch(`${API_URL}/api/auth/users/${userId}/approve`, {
                method: 'POST',
            });
            const json = await res.json();
            if (json.success) {
                // Remove the user from the pending list
                setPendingUsers((prev) => prev.filter((u) => u.id !== userId));
            }
        } catch (error) {
            console.error('Failed to approve user:', error);
        } finally {
            setApprovingId(null);
        }
    };

    if (!session?.user?.is_admin) {
        return (
            <div className="flex-1 p-8 flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 text-hub-muted animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-hub-text mb-2">Platform Administration</h1>
                    <p className="text-hub-muted">Manage user access and registry boundaries.</p>
                </div>
                <div className="px-3 py-1 bg-red-500/10 border border-red-500/20 text-red-500 rounded-full text-xs font-semibold flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    Admin Access
                </div>
            </header>

            <section className="bg-hub-surface border border-hub-border rounded-xl shadow-sm overflow-hidden">
                <div className="p-6 border-b border-hub-border">
                    <h2 className="text-lg font-semibold text-hub-text flex items-center gap-2">
                        <User className="w-5 h-5 text-hub-muted" />
                        Pending Approval Requests
                    </h2>
                </div>

                <div className="p-0">
                    {loading ? (
                        <div className="p-8 text-center text-hub-muted flex flex-col items-center justify-center">
                            <Loader2 className="w-6 h-6 animate-spin mb-4" />
                            Loading pending users...
                        </div>
                    ) : pendingUsers.length === 0 ? (
                        <div className="p-12 text-center text-hub-muted flex flex-col items-center justify-center">
                            <CheckCircle2 className="w-12 h-12 text-green-500/50 mb-4" />
                            <p className="text-sm font-medium">All caught up!</p>
                            <p className="text-xs mt-1">There are no pending user requests.</p>
                        </div>
                    ) : (
                        <ul className="divide-y divide-hub-border">
                            {pendingUsers.map((user) => (
                                <li key={user.id} className="p-6 flex items-center justify-between hover:bg-white/5 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                                            <span className="text-blue-500 font-bold text-sm uppercase">
                                                {user.email.substring(0, 2)}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="font-medium text-hub-text text-sm">{user.email}</p>
                                            <p className="text-xs text-hub-muted">Requested: {new Date(user.created_at).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleApprove(user.id)}
                                        disabled={approvingId === user.id}
                                        className="flex items-center gap-2 px-4 py-2 bg-white text-black font-medium text-xs rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {approvingId === user.id ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <CheckCircle2 className="w-4 h-4" />
                                        )}
                                        Approve Access
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </section>
        </div>
    );
}
