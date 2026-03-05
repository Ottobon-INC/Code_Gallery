import type { Metadata } from 'next';
import './globals.css';


import AuthProvider from '@/components/AuthProvider';

export const metadata: Metadata = {
    title: 'Ottobon Component Hub',
    description: 'Enterprise component registry — search, preview, and inject shared UI components.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body className="bg-hub-bg text-hub-text min-h-screen selection:bg-hub-accent/20">
                <AuthProvider>
                    {children}
                </AuthProvider>
            </body>
        </html>
    );
}
