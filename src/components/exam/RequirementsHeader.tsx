'use client';

import { useExamStore } from '@/store/exam-store';
import { useMemo } from 'react';

export function RequirementsHeader() {
    const requirements = useExamStore(s => s.requirements);
    const userState = useExamStore(s => s.userState); // Record<number, UserRequirementState>

    const stats = useMemo(() => {
        const total = requirements.length;
        let done = 0;
        let learning = 0;

        // Iterate through userState values
        Object.values(userState).forEach(state => {
            if (state.status === 'done') done++;
            else if (state.status === 'learning') learning++;
        });

        const todo = total - done - learning;
        const progress = Math.round((done / total) * 100) || 0;

        return { total, done, learning, todo, progress };
    }, [requirements, userState]);

    return (
        <div className="p-4 border-b bg-white">
            <div className="flex items-center gap-4 mb-4">
                <div className="bg-blue-600 rounded-xl p-3 text-white shadow-lg shadow-blue-200">
                    {/* Modern simplified icon concept */}
                    <div className="w-6 h-6 border-2 border-white rounded-full flex items-center justify-center">
                        <span className="font-bold text-xs">JJ</span>
                    </div>
                </div>
                <div>
                    <h1 className="font-bold text-lg text-slate-900 leading-tight">Exame Faixa Azul</h1>
                    <p className="text-xs font-semibold text-slate-500">Equipe Wado • {stats.total} requisitos</p>
                </div>
            </div>

            <div className="space-y-2">
                {/* Segmented Progress Bar */}
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex">
                    <div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: `${(stats.done / stats.total) * 100}%` }} />
                    <div className="bg-amber-400 h-full transition-all duration-500" style={{ width: `${(stats.learning / stats.total) * 100}%` }} />
                </div>

                <div className="flex gap-4 text-[10px] text-slate-500 font-semibold pt-1">
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span>Sei ({stats.done})</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-amber-400" />
                        <span>Aprendendo ({stats.learning})</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-slate-200" />
                        <span>Não sei ({stats.todo})</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
