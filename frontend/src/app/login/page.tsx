'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const res = await signIn('credentials', {
            redirect: false,
            email,
            password,
        });

        if (res?.error) {
            setError('Invalid credentials');
            setLoading(false);
        } else {
            router.push('/');
            router.refresh(); // Force a refresh to update session state across the app
        }
    };

    return (
        <div className="min-h-screen bg-hub-bg flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-hub-surface border border-hub-border rounded-xl p-8 shadow-2xl">
                <div className="mb-8 text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                        <h1 className="text-2xl font-bold text-hub-text tracking-tight">
                            ottobon<span className="text-hub-muted">hub</span>
                        </h1>
                    </div>
                    <p className="text-hub-muted text-sm">Sign in to your account</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-md">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-medium text-hub-muted uppercase tracking-wider mb-1">
                            Email
                        </label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-hub-bg border border-hub-border rounded-md px-3 py-2 text-sm text-hub-text focus:outline-none focus:border-white/20 transition-colors"
                            placeholder="you@company.com"
                        />
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <label className="block text-xs font-medium text-hub-muted uppercase tracking-wider">
                                Password
                            </label>
                            <Link href="/forgot-password" className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
                                Forgot password?
                            </Link>
                        </div>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-hub-bg border border-hub-border rounded-md px-3 py-2 text-sm text-hub-text focus:outline-none focus:border-white/20 transition-colors"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-white text-black hover:bg-gray-200 transition-colors font-medium py-2 rounded-md text-sm flex items-center justify-center mt-6"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sign In'}
                    </button>

                    <p className="text-center text-xs text-hub-muted mt-4">
                        Don't have an account?{' '}
                        <Link href="/register" className="text-blue-400 hover:text-blue-300 transition-colors">
                            Request Access
                        </Link>
                    </p>
                </form>
            </div>
        </div>
    );
}
