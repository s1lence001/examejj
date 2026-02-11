'use client';

import { useState, useMemo } from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';

import { useExamStore } from '@/store/exam-store';
import { RequirementItem } from './RequirementItem';
import { GroupItem } from './GroupItem';
import { SortableItem } from './SortableItem';
import { RequirementsHeader } from './RequirementsHeader';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search } from 'lucide-react';

import { TooltipProvider } from '@/components/ui/tooltip';

export function RequirementsList() {
    const listOrder = useExamStore(s => s.listOrder);
    const requirements = useExamStore(s => s.requirements);
    const groups = useExamStore(s => s.groups);
    const selectedIds = useExamStore(s => s.selectedIds);
    const activeRequirementId = useExamStore(s => s.activeRequirementId);
    const userState = useExamStore(s => s.userState);
    const selectItem = useExamStore(s => s.selectItem);
    const setActiveRequirement = useExamStore(s => s.setActiveRequirement);
    const reorderList = useExamStore(s => s.reorderList);

    const [searchQuery, setSearchQuery] = useState('');

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 8 },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const moveItem = useExamStore(s => s.moveItem);

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            moveItem(active.id as string | number, over.id as string | number);
        }
    };

    // Filter logic
    const filteredListOrder = useMemo(() => {
        if (!searchQuery.trim()) return listOrder;

        const q = searchQuery.toLowerCase();

        return listOrder.filter(itemId => {
            if (typeof itemId === 'string') {
                // Group: check if group name or any child matches
                const group = groups[itemId];
                if (!group) return false;
                if (group.name.toLowerCase().includes(q)) return true;
                return group.requirementIds.some(rid => {
                    const req = requirements.find(r => r.id === rid);
                    return req && req.name.toLowerCase().includes(q);
                });
            } else {
                const req = requirements.find(r => r.id === itemId);
                return req && req.name.toLowerCase().includes(q);
            }
        });
    }, [listOrder, searchQuery, requirements, groups]);

    return (
        <TooltipProvider>
            <div className="h-full w-full flex flex-col bg-white overflow-hidden">
                {/* Header with Progress */}
                <RequirementsHeader />

                {/* Search */}
                <div className="px-4 py-3 border-b shrink-0">
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar requisito..."
                            className="w-full h-10 pl-10 pr-3 rounded-lg border border-slate-200 bg-slate-50 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-300 transition-all placeholder:text-slate-400"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Table Header */}
                <div className="grid grid-cols-[40px_1fr_50px_110px] items-center gap-1 px-3 py-2 border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold text-slate-400 uppercase tracking-wider shrink-0">
                    <div className="text-center pl-2">#</div>
                    <div>Nome</div>
                    <div className="text-center">Qtd</div>
                    <div className="text-right">Status</div>
                </div>

                {/* List */}
                <ScrollArea className="flex-1 overflow-hidden">
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            id="root"
                            items={filteredListOrder}
                            strategy={verticalListSortingStrategy}
                        >
                            <div className="pb-8">
                                {filteredListOrder.map((itemId) => {
                                    if (typeof itemId === 'string') {
                                        return (
                                            <SortableItem key={itemId} id={itemId}>
                                                <GroupItem groupId={itemId} />
                                            </SortableItem>
                                        );
                                    } else {
                                        const req = requirements.find(r => r.id === itemId);
                                        if (!req) return null;
                                        return (
                                            <SortableItem key={req.id} id={req.id}>
                                                <RequirementItem
                                                    requirement={req}
                                                    isSelected={selectedIds.includes(req.id)}
                                                    isActive={activeRequirementId === req.id}
                                                    status={userState[req.id]?.status}
                                                    onSelect={(m, r) => selectItem(req.id, m, r)}
                                                    onClick={() => setActiveRequirement(req.id)}
                                                />
                                            </SortableItem>
                                        );
                                    }
                                })}

                                {filteredListOrder.length === 0 && searchQuery && (
                                    <div className="p-8 text-center text-sm text-slate-400">
                                        Nenhum requisito encontrado para &quot;{searchQuery}&quot;
                                    </div>
                                )}
                            </div>
                        </SortableContext>
                    </DndContext>
                </ScrollArea>
            </div>
        </TooltipProvider>
    );
}
