'use client';

import { useExamStore } from '@/store/exam-store';
import { Button } from '@/components/ui/button';
import { FolderInput, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function FloatingActionBar() {
    const selectedIds = useExamStore(s => s.selectedIds);
    const clearSelection = useExamStore(s => s.clearSelection);
    const createGroup = useExamStore(s => s.createGroup);
    const selectionTriggeredByShift = useExamStore(s => s.selectionTriggeredByShift);

    if (selectedIds.length < 2 || !selectionTriggeredByShift) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                className="absolute bottom-6 left-0 right-0 flex justify-center z-50 pointer-events-none px-4"
            >
                <div className="bg-slate-900/95 backdrop-blur-sm text-white shadow-2xl rounded-full px-6 py-3 flex items-center gap-4 pointer-events-auto border border-slate-700">
                    <span className="text-sm font-medium whitespace-nowrap">
                        {selectedIds.length} selecionado(s)
                    </span>

                    <div className="h-4 w-px bg-slate-700" />

                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-white hover:bg-slate-800 hover:text-blue-300 gap-2 h-8 px-2"
                        onClick={() => {
                            const name = prompt("Nome do grupo:");
                            if (name) createGroup(name);
                        }}
                    >
                        <FolderInput size={18} />
                        <span className="sr-only md:not-sr-only">Agrupar</span>
                    </Button>

                    <div className="h-4 w-px bg-slate-700" />

                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white"
                        onClick={clearSelection}
                    >
                        <X size={14} />
                    </Button>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
