'use client';

import { useState } from 'react';
import { Requisito, GrupoRequisitos } from '@/types';
import RequisitoRow from './RequisitoRow';

interface GrupoAccordionProps {
    grupo: GrupoRequisitos;
    requisitos: Requisito[];
    isOriginal: boolean;
    expandedRows: Set<number>;
    selectedRows: Set<number>;
    draggedIndex: number | null;
    allRequisitos: Requisito[];
    onToggleExpand: (id: number) => void;
    onToggleSelect: (id: number) => void;
    onDragStart: (index: number) => void;
    onDragOver: (e: React.DragEvent, index: number) => void;
    onDragEnd: () => void;
    onChangeCor: (id: number, cor: string | undefined) => void;
    onRemoverGrupo: (id: string) => void;
}

export default function GrupoAccordion({
    grupo,
    requisitos,
    isOriginal,
    expandedRows,
    selectedRows,
    draggedIndex,
    allRequisitos,
    onToggleExpand,
    onToggleSelect,
    onDragStart,
    onDragOver,
    onDragEnd,
    onChangeCor,
    onRemoverGrupo,
}: GrupoAccordionProps) {
    const [isOpen, setIsOpen] = useState(true);

    return (
        <div className="border-b-2 border-blue-200">
            {/* Header do grupo */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center gap-2 px-3 py-2.5 bg-blue-50 hover:bg-blue-100 transition-colors"
            >
                <span
                    className="text-blue-600 text-xs transition-transform"
                    style={{ transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}
                >
                    ▶
                </span>
                <span className="text-sm font-bold text-blue-800">📁 {grupo.nome}</span>
                <span className="text-xs text-blue-500">
                    ({requisitos.length} requisitos)
                </span>
                {!isOriginal && (
                    <span
                        onClick={(e) => { e.stopPropagation(); onRemoverGrupo(grupo.id); }}
                        className="ml-auto text-xs text-red-400 hover:text-red-600 cursor-pointer"
                    >
                        ✕ Desfazer
                    </span>
                )}
            </button>

            {/* Conteúdo do grupo */}
            {isOpen && (
                <div className="bg-blue-50/20">
                    {requisitos.map(req => {
                        const globalIndex = allRequisitos.findIndex(r => r.id === req.id);
                        return (
                            <RequisitoRow
                                key={req.id}
                                req={req}
                                index={globalIndex}
                                isOriginal={isOriginal}
                                isExpanded={expandedRows.has(req.id)}
                                isSelected={selectedRows.has(req.id)}
                                onToggleExpand={() => onToggleExpand(req.id)}
                                onToggleSelect={() => onToggleSelect(req.id)}
                                onDragStart={() => onDragStart(globalIndex)}
                                onDragOver={(e) => onDragOver(e, globalIndex)}
                                onDragEnd={onDragEnd}
                                onChangeCor={(cor) => onChangeCor(req.id, cor)}
                                isDragging={draggedIndex === globalIndex}
                            />
                        );
                    })}
                </div>
            )}
        </div>
    );
}
