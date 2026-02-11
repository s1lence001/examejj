'use client';

import { useExamStore } from '@/store/exam-store';
import { RequirementItem } from './RequirementItem';
import { cn } from '@/lib/utils';
import { ChevronRight, ChevronDown, FolderOpen, GripVertical, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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
    const selectItem = useExamStore(s => s.selectItem);
    const setActiveRequirement = useExamStore(s => s.setActiveRequirement);

    if (!group) return null;

    return (
        <div className="border-b border-slate-200">
            {/* Group Header */}
            <div className="flex items-center gap-2 p-2 bg-slate-100 hover:bg-slate-200/50 group select-none transition-colors">
                <div className="text-slate-300 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing">
                    <GripVertical size={14} />
                </div>

                <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 hover:bg-slate-300/50"
                    onClick={() => toggleCollapse(groupId)}
                >
                    {group.collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                </Button>

                <div className="flex items-center gap-2 flex-1 overflow-hidden">
                    <FolderOpen size={16} className="text-blue-500 shrink-0" />
                    <span className="text-sm font-semibold text-slate-700 truncate">{group.name}</span>
                    <span className="text-xs text-slate-400 font-mono">({group.requirementIds.length})</span>
                </div>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100">
                            <Settings2 size={14} />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => {
                            const newName = prompt("Renomear grupo:", group.name);
                            // TODO: Implement rename in store
                        }}>
                            Renomear
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600" onClick={() => ungroup(groupId)}>
                            Desagrupar
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Group Items */}
            {!group.collapsed && (
                <div className="pl-4 border-l-2 border-slate-100 ml-4 my-1">
                    {group.requirementIds.map(reqId => {
                        const req = requirements.find(r => r.id === reqId);
                        if (!req) return null;
                        return (
                            <RequirementItem
                                key={reqId}
                                requirement={req}
                                isSelected={selectedIds.includes(reqId)}
                                isActive={activeRequirementId === reqId}
                                status={userState[reqId]?.status}
                                onSelect={(m, r) => selectItem(reqId, m, r)}
                                onClick={() => setActiveRequirement(reqId)}
                            />
                        );
                    })}
                </div>
            )}
        </div>
    );
}
