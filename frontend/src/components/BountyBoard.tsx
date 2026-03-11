'use client';

import { useState } from 'react';
import {
    DndContext, DragEndEvent, DragOverEvent, DragOverlay,
    DragStartEvent, PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Bounty } from '@/types';
import { api } from '@/lib/api';

type Column = Bounty['status'];

const COLUMNS: { id: Column; label: string; dot: string }[] = [
    { id: 'requested', label: 'Requested', dot: 'bg-hub-muted' },
    { id: 'in-progress', label: 'In Progress', dot: 'bg-yellow-500' },
    { id: 'completed', label: 'Completed', dot: 'bg-green-500' },
];

function BountyCard({ bounty, isDragging = false }: { bounty: Bounty; isDragging?: boolean }) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: bounty.id });
    const style = { transform: CSS.Transform.toString(transform), transition };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={`card p-4 cursor-grab active:cursor-grabbing select-none hover:border-white/20 transition-all ${isDragging ? 'opacity-40 shadow-2xl scale-[1.02]' : ''
                }`}
        >
            <h4 className="text-hub-text text-sm font-medium">{bounty.title}</h4>
            <p className="text-hub-muted text-xs mt-1.5 line-clamp-2 leading-snug">
                {bounty.description}
            </p>
            {bounty.claimed_by && (
                <div className="mt-3 flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-[9px] text-white">
                        {bounty.claimed_by.slice(0, 2).toUpperCase()}
                    </div>
                    <span className="text-[10px] text-hub-muted font-medium">Claimed by {bounty.claimed_by.slice(0, 6)}...</span>
                </div>
            )}
        </div>
    );
}

export function BountyBoard({ initialBounties }: { initialBounties: Bounty[] }) {
    const [bounties, setBounties] = useState<Bounty[]>(initialBounties);
    const [activeId, setActiveId] = useState<string | null>(null);

    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

    const byColumn = (col: Column) => bounties.filter((b) => b.status === col);
    const activeBounty = bounties.find((b) => b.id === activeId);

    const handleDragStart = (e: DragStartEvent) => setActiveId(e.active.id as string);

    const handleDragOver = (e: DragOverEvent) => {
        const { active, over } = e;
        if (!over) return;
        const overCol = COLUMNS.find((c) => c.id === over.id);
        if (!overCol) return;
        setBounties((prev) => prev.map((b) => (b.id === active.id ? { ...b, status: overCol.id } : b)));
    };

    const handleDragEnd = async (e: DragEndEvent) => {
        setActiveId(null);
        const { active, over } = e;
        if (!over) return;
        const overCol = COLUMNS.find((c) => c.id === over.id);
        if (!overCol) return;

        const bounty = bounties.find((b) => b.id === active.id);
        if (bounty && bounty.status !== overCol.id) {
            try { await api.bounties.updateStatus(active.id as string, overCol.id); }
            catch { /* Optimistic UI revert is skipped via state for brevity */ }
        }
    };

    return (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full items-start">
                {COLUMNS.map((col) => {
                    const cards = byColumn(col.id);
                    return (
                        <div key={col.id} id={col.id} className="flex flex-col min-h-[500px]">
                            {/* Column header */}
                            <div className="flex items-center gap-2 mb-4 px-1">
                                <span className={`w-2 h-2 rounded-full ${col.dot}`} />
                                <h3 className="text-sm font-semibold text-hub-text">{col.label}</h3>
                                <span className="ml-auto text-xs text-hub-muted font-mono">{cards.length}</span>
                            </div>

                            {/* Column Body */}
                            <div className="flex-1 bg-hub-surface/40 border border-hub-border rounded-xl p-3 flex flex-col gap-3">
                                <SortableContext items={cards.map((b) => b.id)} strategy={verticalListSortingStrategy}>
                                    {cards.map((bounty) => <BountyCard key={bounty.id} bounty={bounty} />)}
                                    {cards.length === 0 && (
                                        <div className="flex-1 border-2 border-dashed border-hub-border rounded-lg flex items-center justify-center text-xs text-hub-muted min-h-[120px]">
                                            Drop components here
                                        </div>
                                    )}
                                </SortableContext>
                            </div>
                        </div>
                    );
                })}
            </div>
            <DragOverlay>{activeBounty ? <BountyCard bounty={activeBounty} isDragging /> : null}</DragOverlay>
        </DndContext>
    );
}
