'use client';

import { useExamStore } from '@/store/exam-store';
import { useMemo, useState, useRef } from 'react';
import { Share2, Download, Upload, Loader2, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogClose
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast";

export function RequirementsHeader() {
    const requirements = useExamStore(s => s.requirements);
    const userState = useExamStore(s => s.userState);
    const exportData = useExamStore(s => s.exportData);
    const importData = useExamStore(s => s.importData);
    const { toast } = useToast();
    const [isImporting, setIsImporting] = useState(false);
    const [isExportOpen, setIsExportOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const stats = useMemo(() => {
        const total = requirements.length;
        let learned = 0;
        let learning = 0;

        // Iterate through userState values
        Object.values(userState).forEach(state => {
            if (state.status === 'learned') learned++;
            else if (state.status === 'learning') learning++;
        });

        const todo = total - learned - learning;
        const progress = Math.round((learned / total) * 100) || 0;

        return { total, learned, learning, todo, progress };
    }, [requirements, userState]);

    const handleExport = () => {
        try {
            const data = exportData();
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `meu-exame-jj-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            toast({
                title: "Sucesso!",
                description: "Seu exame foi exportado com sucesso."
            });
        } catch (err) {
            toast({
                title: "Erro ao exportar",
                description: "Não foi possível gerar o arquivo.",
                variant: "destructive"
            });
        }
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsImporting(true);
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const content = event.target?.result as string;
                await importData(content);
                toast({
                    title: "Importação Concluída!",
                    description: "Os dados foram carregados com sucesso."
                });
                setIsExportOpen(false);
            } catch (err) {
                toast({
                    title: "Erro ao importar",
                    description: "O arquivo parece inválido ou corrompido.",
                    variant: "destructive"
                });
            } finally {
                setIsImporting(false);
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="p-4 border-b bg-white">
            <div className="flex items-center gap-4 mb-4 pr-12">
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

                <div className="ml-auto">
                    <Dialog open={isExportOpen} onOpenChange={setIsExportOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-2 text-slate-600 border-slate-200">
                                <Share2 size={14} />
                                <span className="hidden sm:inline">Compartilhar</span>
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle>Compartilhar Estudo</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <p className="text-sm text-slate-500 leading-relaxed">
                                    Exporte sua estrutura de estudos (grupos, pastas, links e notas) para enviar a um amigo, ou importe um arquivo recebido.
                                </p>

                                <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg flex gap-3">
                                    <Info size={18} className="text-blue-500 shrink-0 mt-0.5" />
                                    <p className="text-xs text-blue-700 leading-tight">
                                        <strong>Nota:</strong> O progresso das técnicas (Sei / Aprendendo) não será importado para que cada aluno comece seu próprio acompanhamento.
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <Button
                                        variant="outline"
                                        className="h-24 flex flex-col gap-2 border-dashed"
                                        onClick={handleExport}
                                    >
                                        <Download className="h-6 w-6 text-slate-400" />
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold">Exportar</span>
                                            <span className="text-[10px] text-slate-400">Gerar Arquivo</span>
                                        </div>
                                    </Button>

                                    <Button
                                        variant="outline"
                                        className="h-24 flex flex-col gap-2 border-dashed relative"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={isImporting}
                                    >
                                        {isImporting ? (
                                            <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />
                                        ) : (
                                            <Upload className="h-6 w-6 text-slate-400" />
                                        )}
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold">Importar</span>
                                            <span className="text-[10px] text-slate-400">Carregar Arquivo</span>
                                        </div>
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            className="hidden"
                                            accept=".json"
                                            onChange={handleImport}
                                        />
                                    </Button>
                                </div>
                            </div>
                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button type="button" variant="ghost">Fechar</Button>
                                </DialogClose>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="space-y-2">
                {/* Segmented Progress Bar */}
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex">
                    <div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: `${(stats.learned / stats.total) * 100}%` }} />
                    <div className="bg-amber-400 h-full transition-all duration-500" style={{ width: `${(stats.learning / stats.total) * 100}%` }} />
                </div>

                <div className="flex gap-4 text-[10px] text-slate-500 font-semibold pt-1">
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span>Sei ({stats.learned})</span>
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
