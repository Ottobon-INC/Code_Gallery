import { api } from '@/lib/api';
import { LeaderboardTable } from '@/components/LeaderboardTable';
import { HoursBarChart } from '@/components/HoursBarChart';
import { LeaderboardEntry } from '@/types';

export default async function AnalyticsPage() {
    let leaderboard: LeaderboardEntry[] = [];
    try { leaderboard = await api.analytics.leaderboard(); }
    catch { /* empty */ }

    const totalHours = leaderboard.reduce((sum, e) => sum + e.total_hours_saved, 0);
    const totalInjections = leaderboard.reduce((sum, e) => sum + e.components_injected, 0);
    const totalBounties = leaderboard.reduce((sum, e) => sum + e.bounties_claimed, 0);

    const barData = leaderboard.slice(0, 8).map((e, i) => ({
        name: `Eng ${i + 1}`,
        hours: parseFloat(e.total_hours_saved.toFixed(1)),
    }));

    return (
        <div className="p-10 max-w-[1400px]">
            {/* Header */}
            <div className="mb-10">
                <h1 className="text-white text-2xl font-bold tracking-tight mb-2">ROI Analytics</h1>
                <p className="text-hub-muted text-sm">
                    Track the development hours your team has saved by reusing shared components via the CLI.
                </p>
            </div>

            {/* Hero stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
                <div className="card p-6 border-l-2 border-l-blue-500 bg-gradient-to-r from-blue-500/5 to-transparent">
                    <p className="text-hub-muted text-xs font-semibold uppercase tracking-wider mb-2">Total Hours Saved</p>
                    <div className="flex items-baseline gap-2">
                        <p className="text-3xl font-bold text-white tracking-tight">{totalHours.toFixed(1)}<span className="text-xl text-blue-500 ml-1">h</span></p>
                    </div>
                </div>
                <div className="card p-6 border-transparent">
                    <p className="text-hub-muted text-xs font-semibold uppercase tracking-wider mb-2">CLI CLI Injections</p>
                    <div className="flex items-baseline gap-2">
                        <p className="text-3xl font-bold text-white tracking-tight">{totalInjections.toLocaleString()}</p>
                    </div>
                </div>
                <div className="card p-6 border-transparent">
                    <p className="text-hub-muted text-xs font-semibold uppercase tracking-wider mb-2">Bounties Completed</p>
                    <div className="flex items-baseline gap-2">
                        <p className="text-3xl font-bold text-white tracking-tight">{totalBounties}</p>
                    </div>
                </div>
            </div>

            {/* Charts & Leadboard Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-6">
                <div className="flex flex-col gap-6">
                    <LeaderboardTable entries={leaderboard} />
                </div>

                {barData.length > 0 ? (
                    <div className="card p-6 self-start sticky top-10">
                        <h2 className="text-white text-sm font-semibold mb-6 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-500" /> Hourly Impact per Engineer
                        </h2>
                        <div className="h-[300px]">
                            <HoursBarChart data={barData} />
                        </div>
                    </div>
                ) : (
                    <div className="card h-full min-h-[400px] flex items-center justify-center border-dashed">
                        <span className="text-hub-muted text-sm">Waiting for telemetry data...</span>
                    </div>
                )}
            </div>
        </div>
    );
}
