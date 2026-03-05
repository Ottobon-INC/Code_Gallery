import { Sidebar } from '@/components/Sidebar';
import { CommandPalette } from '@/components/CommandPalette';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <CommandPalette />
            <div className="flex min-h-screen">
                <Sidebar />
                <main className="flex-1 min-w-0 overflow-y-auto">
                    {children}
                </main>
            </div>
        </>
    );
}
