import type { LeaderboardEntry } from '@/types';

interface LeaderboardTableProps {
    entries: LeaderboardEntry[];
}

export function LeaderboardTable({ entries }: LeaderboardTableProps) {
    return (
        <div className="card overflow-hidden">
            <div className="px-6 py-5 border-b border-hub-border flex items-center justify-between bg-hub-surface">
                <div>
                    <h2 className="text-hub-text text-base font-semibold">Global Leaderboard</h2>
                    <p className="text-hub-muted text-sm mt-1">Ranked by total development hours saved</p>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-hub-border bg-[#0A0A0C]">
                            <th className="text-left px-6 py-3 font-medium text-hub-muted w-16">Rank</th>
                            <th className="text-left px-6 py-3 font-medium text-hub-muted">Engineer</th>
                            <th className="text-right px-6 py-3 font-medium text-hub-muted">Hours Saved</th>
                            <th className="text-right px-6 py-3 font-medium text-hub-muted">Injections</th>
                            <th className="text-right px-6 py-3 font-medium text-hub-muted">Bounties</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-hub-border">
                        {entries.map((e, i) => (
                            <tr key={e.user_id} className={`hover:bg-white/5 transition-colors ${i === 0 ? 'bg-white/[0.02]' : ''}`}>
                                <td className="px-6 py-4 font-mono text-hub-muted">
                                    {i === 0 ? <span className="text-yellow-500">01</span> : (i + 1).toString().padStart(2, '0')}
                                </td>
                                <td className="px-6 py-4 flex items-center gap-3">
                                    <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-gray-800 to-gray-700 flex items-center justify-center text-[10px] text-white border border-white/10">
                                        {e.user_id.slice(0, 2).toUpperCase()}
                                    </div>
                                    <span className="text-hub-text font-mono text-xs">{e.user_id.slice(0, 8)}…</span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <span className={`font-semibold ${i === 0 ? 'text-white' : 'text-hub-text'}`}>
                                        {e.total_hours_saved.toFixed(1)}h
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right text-hub-muted">{e.components_injected}</td>
                                <td className="px-6 py-4 text-right">
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-500 border border-green-500/20">
                                        {e.bounties_claimed}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {entries.length === 0 && (
                    <div className="py-20 text-center flex flex-col items-center">
                        <div className="text-hub-muted text-3xl mb-3">◱</div>
                        <p className="text-hub-text text-sm font-medium">No telemetry data</p>
                        <p className="text-hub-muted text-xs mt-1">Start using the CLI to track hours saved.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
