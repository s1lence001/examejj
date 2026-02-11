'use client';

import { memo } from 'react';
import { ExamRequirement, LearningStatus } from '@/types/exam';
import { cn } from '@/lib/utils';
import { CheckCircle2, Circle, Clock, GripVertical } from 'lucide-react';

interface RequirementItemProps {
    requirement: ExamRequirement;
    isSelected: boolean;
    isActive: boolean;
    status?: LearningStatus;
    onSelect: (multi: boolean, range: boolean) => void;
    onClick: () => void;
}

const STATUS_CONFIG: Record<string, { label: string; icon: any; color: string; bgColor: string; borderColor: string }> = {
    learned: { label: 'Sei', icon: CheckCircle2, color: 'text-emerald-600', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-200' },
    learning: { label: 'Aprendendo', icon: Clock, color: 'text-amber-600', bgColor: 'bg-amber-50', borderColor: 'border-amber-200' },
    todo: { label: 'Não sei', icon: Circle, color: 'text-slate-400', bgColor: 'bg-slate-50', borderColor: 'border-slate-200' },
};

export const RequirementItem = memo(({
    requirement,
    isSelected,
    isActive,
    status = 'todo',
    onSelect,
    onClick
}: RequirementItemProps) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.todo;
    const Icon = config.icon;

    return (
        <div
            role="button"
            tabIndex={0}
            className={cn(
                "relative grid grid-cols-[40px_1fr_50px_110px] items-center gap-1 px-3 py-3 border-b border-slate-100 cursor-pointer transition-all select-none group focus:outline-none",
                !isSelected && !isActive && "hover:bg-slate-50/50 focus:bg-slate-50",
                isSelected && "bg-blue-100 border-l-4 border-l-blue-500 shadow-sm",
                isActive && !isSelected && "bg-slate-50 border-l-[3px] border-l-blue-500"
            )}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onClick();
                    onSelect(e.metaKey || e.ctrlKey, e.shiftKey);
                }
            }}
            onClick={(e) => {
                if (e.shiftKey || e.metaKey || e.ctrlKey) {
                    e.preventDefault();
                }
                const isMulti = e.metaKey || e.ctrlKey;
                const isRange = e.shiftKey;
                if (isMulti || isRange) {
                    onSelect(isMulti, isRange);
                } else {
                    onClick();
                    onSelect(false, false);
                }
            }}
        >
            {/* Drag Handle - Absolute Positioned */}
            <div className="absolute left-1 top-1/2 -translate-y-1/2 flex justify-center text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing z-10 p-1">
                <GripVertical size={14} />
            </div>

            {/* # (Number) */}
            <div className="text-xs font-medium text-slate-400 text-center pl-2">
                {requirement.id}
            </div>

            {/* NOME */}
            <div className="text-sm font-semibold text-slate-700 truncate pr-2 uppercase">
                {requirement.name}
            </div>

            {/* QTD */}
            <div className="text-sm font-medium text-slate-500 text-center">
                {requirement.qtd}
            </div>

            {/* STATUS */}
            <div className="flex justify-end">
                <span className={cn(
                    "inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border",
                    config.color, config.bgColor, config.borderColor
                )}>
                    <Icon size={12} />
                    {config.label}
                </span>
            </div>
        </div>
    );
});

RequirementItem.displayName = 'RequirementItem';
