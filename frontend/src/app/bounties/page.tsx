import { api } from '@/lib/api';
import { BountiesClient } from './BountiesClient';

import { Bounty } from '@/types';

export default async function BountiesPage() {
    let bounties: Bounty[] = [];
    try { bounties = await api.bounties.list(); }
    catch { /* empty */ }

    return (
        <div className="p-10 max-w-[1400px]">
            <BountiesClient initialBounties={bounties} />
        </div>
    );
}
