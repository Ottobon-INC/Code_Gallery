'use client';

import { LogOut } from 'lucide-react';
import { signOut } from 'next-auth/react';

export default function PendingApprovalPage() {
    return (
        <div className="min-h-screen bg-hub-bg flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-hub-surface border border-hub-border rounded-xl p-8 shadow-2xl text-center">
                <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <div className="w-8 h-8 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
                </div>

                <h1 className="text-2xl font-bold text-hub-text tracking-tight mb-2">
                    Pending Approval
                </h1>

                <p className="text-hub-muted text-sm mb-8 leading-relaxed">
                    Your account has been successfully created. For security purposes, an administrator must manually approve your account before you can access the Enterprise Component Hub.
                </p>

                <div className="bg-hub-bg border border-hub-border rounded-md p-4 mb-8">
                    <p className="text-xs text-hub-muted">
                        Please check back later or contact your team lead for expedited approval.
                    </p>
                </div>

                <button
                    onClick={() => signOut({ callbackUrl: '/login' })}
                    className="flex items-center justify-center gap-2 w-full text-sm font-medium text-hub-muted hover:text-white transition-colors py-2"
                >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                </button>
            </div>
        </div>
    );
}
