'use client';

import { useExamStore } from '@/store/exam-store';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MediaManager } from '@/components/exam/MediaManager';
import { LearningStatus } from '@/types/exam';
import { cn } from '@/lib/utils';
import { CheckCircle2, Clock, Circle, Video, FileText } from 'lucide-react';

const STATUS_OPTIONS: { value: LearningStatus; label: string; icon: any; color: string }[] = [
    { value: 'todo', label: 'Não sei', icon: Circle, color: 'text-slate-400' },
    { value: 'learning', label: 'Aprendendo', icon: Clock, color: 'text-amber-500' },
    { value: 'learned', label: 'Dominada', icon: CheckCircle2, color: 'text-green-500' },
];

export function DetailPanel() {
    const activeRequirementId = useExamStore(s => s.activeRequirementId);
    const requirements = useExamStore(s => s.requirements);
    const userState = useExamStore(s => s.userState);
    const updateStatus = useExamStore(s => s.updateStatus);
    const updateNotes = useExamStore(s => s.updateNotes);

    if (!activeRequirementId) {
        return (
            <div className="h-full flex items-center justify-center text-slate-400 bg-slate-50/50">
                <div className="text-center">
                    <p>Selecione um requisito</p>
                    <p className="text-xs opacity-50 mt-1">Clique na lista para ver detalhes</p>
                </div>
            </div>
        );
    }

    const req = requirements.find(r => r.id === activeRequirementId);
    if (!req) return null;

    const state = userState[activeRequirementId] || { status: 'todo', notes: '' };

    return (
        <div className="h-full flex flex-col bg-slate-50">
            {/* Header */}
            <div className="p-6 bg-white border-b shadow-sm">
                <div className="flex items-center gap-2 mb-2 text-xs font-mono text-slate-400">
                    <Badge variant="outline">#{req.id}</Badge>
                    <span>{req.category}</span>
                    {req.qtd !== '-' && <span>• QTD: {req.qtd}</span>}
                </div>
                <h1 className="text-xl font-bold text-slate-800 mb-6">{req.name}</h1>

                {/* Status Selector */}
                <div className="grid grid-cols-3 gap-2">
                    {STATUS_OPTIONS.map((opt) => (
                        <button
                            key={opt.value}
                            onClick={() => updateStatus(req.id, opt.value)}
                            className={cn(
                                "flex items-center justify-center gap-2 py-2 px-3 rounded-md border text-sm font-medium transition-all",
                                state.status === opt.value
                                    ? "bg-white border-blue-500 ring-1 ring-blue-500 shadow-sm"
                                    : "bg-slate-50 border-slate-200 hover:bg-slate-100 opacity-70 hover:opacity-100"
                            )}
                        >
                            <opt.icon size={16} className={opt.color} />
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Tabs */}
            <Tabs defaultValue="media" className="flex-1 flex flex-col overflow-hidden">
                <div className="px-6 pt-4 border-b bg-white/50 backdrop-blur-sm">
                    <TabsList className="w-full justify-start h-auto p-0 bg-transparent gap-6">
                        <TabsTrigger value="media" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-blue-500 rounded-none px-0 py-2">
                            <Video size={16} className="mr-2" />
                            Multimídia
                        </TabsTrigger>
                        <TabsTrigger value="notes" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-blue-500 rounded-none px-0 py-2">
                            <FileText size={16} className="mr-2" />
                            Anotações
                        </TabsTrigger>
                    </TabsList>
                </div>

                <div className="flex-1 overflow-hidden p-6">
                    <TabsContent value="media" className="h-full m-0">
                        <MediaManager reqId={req.id} />
                    </TabsContent>

                    <TabsContent value="notes" className="h-full m-0">
                        <Textarea
                            className="h-full resize-none bg-white p-4 leading-relaxed"
                            placeholder="Escreva suas observações, detalhes da técnica ou dúvidas..."
                            value={state.notes || ''}
                            onChange={(e) => updateNotes(req.id, e.target.value)}
                        />
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    );
}
