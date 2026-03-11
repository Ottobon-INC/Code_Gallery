'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (!token) {
            setError('Invalid or missing reset token.');
        }
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) return;

        setError('');
        setLoading(true);

        try {
            const res = await fetch(`${API_URL}/api/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password }),
            });
            const data = await res.json();

            if (!res.ok || !data.success) {
                setError(data.error || 'Failed to reset password');
            } else {
                setSuccess(true);
                setTimeout(() => {
                    router.push('/login');
                }, 3000);
            }
        } catch (err) {
            setError('An error occurred while resetting your password');
        } finally {
            setLoading(false);
        }
    };

    if (!token) {
        return (
            <div className="text-center p-6 bg-neutral-900/50 ring-1 ring-inset ring-white/10 rounded-2xl">
                <p className="text-red-400 mb-4">{error}</p>
                <Link href="/forgot-password" className="text-sm text-white underline">
                    Request a new password reset link
                </Link>
            </div>
        );
    }

    if (success) {
        return (
            <div className="text-center p-8 bg-neutral-900/50 ring-1 ring-inset ring-white/10 rounded-2xl">
                <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <h2 className="text-xl font-bold text-white mb-2">Password Reset!</h2>
                <p className="text-neutral-400 text-sm mb-6">Your password has been changed successfully. Redirecting you to login...</p>
                <Link href="/login" className="text-sm px-4 py-2 bg-white text-black font-semibold rounded-lg hover:bg-neutral-200 transition-colors">
                    Go to Login Now
                </Link>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="bg-neutral-900/50 ring-1 ring-inset ring-white/10 rounded-2xl p-6 backdrop-blur-xl space-y-4">
            <p className="text-sm text-neutral-400 mb-6 text-center">Enter your new password below.</p>

            {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                    {error}
                </div>
            )}

            <div className="space-y-1.5">
                <label className="text-xs font-medium text-neutral-300 pl-1">New Password</label>
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                    placeholder="••••••••"
                    required
                    minLength={6}
                />
            </div>

            <button
                type="submit"
                disabled={loading || password.length < 6}
                className="w-full mt-4 bg-white text-black font-semibold rounded-xl px-4 py-2.5 text-sm hover:bg-neutral-200 focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-black transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading ? 'Resetting...' : 'Reset Password'}
            </button>
        </form>
    );
}

export default function ResetPasswordPage() {
    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="w-full max-w-sm">
                <div className="mb-8 text-center">
                    <h1 className="text-2xl font-bold text-white mb-2">Create New Password</h1>
                </div>

                <Suspense fallback={<div className="text-center p-6 text-neutral-500">Loading...</div>}>
                    <ResetPasswordForm />
                </Suspense>
            </div>
        </div>
    );
}
