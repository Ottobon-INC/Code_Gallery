import { Sidebar } from '@/components/Sidebar';
import { CommandPalette } from '@/components/CommandPalette';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <CommandPalette />
            <div className="flex flex-col md:flex-row min-h-screen">
                <Sidebar />
                <main className="flex-1 min-w-0 overflow-y-auto w-full">
                    {children}
                </main>
            </div>
        </>
    );
}
