'use client';

import { useState } from 'react';
import { useExamStore } from '@/store/exam-store';
import { RequirementItem } from './RequirementItem';
import { SortableItem } from './SortableItem';
import { cn } from '@/lib/utils';
import { ChevronRight, ChevronDown, FolderOpen, GripVertical, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CreateGroupDialog } from './CreateGroupDialog';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { AnimatePresence, motion } from 'framer-motion';

interface GroupItemProps {
    groupId: string;
}

export function GroupItem({ groupId }: GroupItemProps) {
    const group = useExamStore(s => s.groups[groupId]);
    const requirements = useExamStore(s => s.requirements);
    const userState = useExamStore(s => s.userState);
    const selectedIds = useExamStore(s => s.selectedIds);
    const activeRequirementId = useExamStore(s => s.activeRequirementId);

    const toggleCollapse = useExamStore(s => s.toggleGroupCollapse);
    const ungroup = useExamStore(s => s.ungroup);
    const renameGroup = useExamStore(s => s.renameGroup);
    const selectItem = useExamStore(s => s.selectItem);
    const setActiveRequirement = useExamStore(s => s.setActiveRequirement);

    const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);

    if (!group) return null;

    const isExpanded = !group.collapsed;

    return (
        <div className="bg-white relative group">
            {/* Drag Handle - Absolute Positioned */}
            <div className="absolute left-0.5 top-1/2 -translate-y-1/2 flex justify-center text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing z-10 p-1">
                <GripVertical size={14} />
            </div>

            {/* Group Header - Matching RequirementItem Grid columns */}
            <div
                className={cn(
                    "grid grid-cols-[40px_1fr_50px_110px] items-center gap-1 px-3 py-3 border-b border-slate-200 group select-none transition-colors cursor-pointer",
                    isExpanded ? "bg-slate-50/80" : "hover:bg-slate-50"
                )}
                onClick={() => toggleCollapse(groupId)}
            >
                {/* # (Arrow icon instead of ID) */}
                <div className="flex items-center justify-center">
                    <div className={cn(
                        "transition-transform duration-200",
                        isExpanded ? "rotate-0 text-blue-600" : "-rotate-90 text-slate-400"
                    )}>
                        <ChevronDown size={14} />
                    </div>
                </div>

                {/* NAME + Icon - Spanning 2 columns to avoid unnecessary truncation */}
                <div className="flex items-center gap-2.5 overflow-hidden col-span-2">
                    <div className={cn(
                        "flex items-center justify-center p-1 rounded transition-colors shrink-0",
                        isExpanded ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-500"
                    )}>
                        <FolderOpen size={14} />
                    </div>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                <span className={cn(
                                    "text-sm font-bold truncate transition-colors uppercase",
                                    isExpanded ? "text-slate-900" : "text-slate-700"
                                )}>
                                    {group.name}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono mt-0.5 shrink-0">
                                    ({group.requirementIds.length})
                                </span>
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{group.name} ({group.requirementIds.length} técnicas)</p>
                        </TooltipContent>
                    </Tooltip>
                </div>

                {/* Actions (Where Status usually is) */}
                <div className="flex justify-end pr-1" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 hover:bg-slate-200/50">
                                <Settings2 size={14} className="text-slate-500" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem onClick={() => setIsRenameDialogOpen(true)} className="gap-2 text-xs">
                                <span>Renomear</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600 gap-2 text-xs" onClick={() => ungroup(groupId)}>
                                <span>Desagrupar</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Group Items with Animation */}
            <AnimatePresence initial={false}>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                        className="overflow-hidden bg-slate-50/20"
                    >
                        <SortableContext
                            id={groupId}
                            items={group.requirementIds}
                            strategy={verticalListSortingStrategy}
                        >
                            <div className="divide-y divide-slate-100/50">
                                {group.requirementIds.map(reqId => {
                                    const req = requirements.find(r => r.id === reqId);
                                    if (!req) return null;
                                    return (
                                        <SortableItem key={reqId} id={reqId}>
                                            <RequirementItem
                                                requirement={req}
                                                isSelected={selectedIds.includes(reqId)}
                                                isActive={activeRequirementId === reqId}
                                                status={userState[reqId]?.status}
                                                onSelect={(m, r) => selectItem(reqId, m, r)}
                                                onClick={() => setActiveRequirement(reqId)}
                                                isNested={true}
                                            />
                                        </SortableItem>
                                    );
                                })}
                            </div>
                        </SortableContext>
                    </motion.div>
                )}
            </AnimatePresence>

            <CreateGroupDialog
                open={isRenameDialogOpen}
                onOpenChange={setIsRenameDialogOpen}
                onConfirm={(name) => renameGroup(groupId, name)}
                defaultName={group.name}
                title="Renomear Grupo"
                description="Altere o nome do seu grupo de técnicas."
            />
        </div>
    );
}
