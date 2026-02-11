'use client';

import { useState } from 'react';
import { Requisito } from '@/types';

const COR_OPTIONS = [
    { label: 'Nenhuma', value: undefined, preview: 'bg-white' },
    { label: 'Vermelho', value: '#fecaca', preview: 'bg-red-200' },
    { label: 'Laranja', value: '#fed7aa', preview: 'bg-orange-200' },
    { label: 'Amarelo', value: '#fef08a', preview: 'bg-yellow-200' },
    { label: 'Verde', value: '#bbf7d0', preview: 'bg-green-200' },
    { label: 'Azul', value: '#bfdbfe', preview: 'bg-blue-200' },
    { label: 'Roxo', value: '#e9d5ff', preview: 'bg-purple-200' },
];

interface RequisitoRowProps {
    req: Requisito;
    index: number;
    isOriginal: boolean;
    isExpanded: boolean;
    isSelected: boolean;
    onToggleExpand: () => void;
    onToggleSelect: () => void;
    onDragStart: () => void;
    onDragOver: (e: React.DragEvent) => void;
    onDragEnd: () => void;
    onChangeCor: (cor: string | undefined) => void;
    isDragging: boolean;
}

function isExpandable(qtd: string | number): boolean {
    if (qtd === 'TODOS') return true;
    if (qtd === '-') return false;
    const num = typeof qtd === 'string' ? parseInt(qtd) : qtd;
    return num > 1;
}

function getQtdNumber(qtd: string | number): number {
    if (qtd === 'TODOS') return 3;
    if (qtd === '-') return 0;
    return typeof qtd === 'string' ? parseInt(qtd) : qtd;
}

export default function RequisitoRow({
    req,
    index,
    isOriginal,
    isExpanded,
    isSelected,
    onToggleExpand,
    onToggleSelect,
    onDragStart,
    onDragOver,
    onDragEnd,
    onChangeCor,
    isDragging,
}: RequisitoRowProps) {
    const [showColorPicker, setShowColorPicker] = useState(false);
    const expandable = isExpandable(req.qtd);

    return (
        <div
            className={`
                border-b border-gray-300
                ${isDragging ? 'opacity-50' : ''}
                ${isSelected ? 'ring-2 ring-inset ring-blue-400' : ''}
            `}
        >
            {/* Linha principal */}
            <div
                draggable={!isOriginal}
                onDragStart={onDragStart}
                onDragOver={onDragOver}
                onDragEnd={onDragEnd}
                className={`
                    flex items-center
                    ${!isOriginal ? 'hover:bg-gray-100' : ''}
                    transition-colors
                `}
                style={{ backgroundColor: req.cor || (index % 2 === 1 ? '#f9fafb' : '#ffffff') }}
            >
                {/* Drag handle */}
                <div className={`w-10 py-2 flex items-center justify-center border-r border-gray-300 flex-shrink-0 ${!isOriginal ? 'cursor-move' : ''}`}>
                    {!isOriginal ? (
                        <span className="text-gray-400 text-xs select-none">⋮⋮</span>
                    ) : (
                        <span className="text-gray-200 text-xs">—</span>
                    )}
                </div>

                {/* Checkbox */}
                {!isOriginal && (
                    <div className="w-8 py-2 flex items-center justify-center border-r border-gray-300 flex-shrink-0">
                        <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={onToggleSelect}
                            className="w-3.5 h-3.5 cursor-pointer accent-blue-600"
                        />
                    </div>
                )}

                {/* Número */}
                <div className="w-12 py-2 text-center text-sm text-gray-900 border-r border-gray-300 flex-shrink-0 font-medium">
                    {req.id}
                </div>

                {/* Nome + Expand */}
                <div className="flex-1 py-2 px-3 flex items-center gap-2 min-w-0 border-r border-gray-300">
                    {expandable ? (
                        <button
                            onClick={onToggleExpand}
                            className={`
                                flex-shrink-0 w-5 h-5 flex items-center justify-center
                                text-xs rounded
                                ${isExpanded
                                    ? 'text-blue-600 bg-blue-50'
                                    : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
                                }
                                transition-all
                            `}
                        >
                            {isExpanded ? '▼' : '▶'}
                        </button>
                    ) : (
                        <span className="w-5 flex-shrink-0" />
                    )}
                    <span className="text-sm text-gray-900 truncate">{req.nome}</span>
                </div>

                {/* QTD */}
                <div className="w-16 py-2 text-center text-sm font-semibold text-gray-900 flex-shrink-0">
                    {req.qtd}
                </div>

                {/* Cor */}
                {!isOriginal && (
                    <div className="w-10 py-2 flex items-center justify-center flex-shrink-0 border-l border-gray-300 relative">
                        <button
                            onClick={() => setShowColorPicker(!showColorPicker)}
                            className="w-5 h-5 rounded-full border border-gray-300 hover:scale-110 transition-transform"
                            style={{ backgroundColor: req.cor || '#ffffff' }}
                        />
                        {showColorPicker && (
                            <div className="absolute right-0 top-full z-20 bg-white border border-gray-200 rounded-lg shadow-xl p-2 w-40">
                                <div className="grid grid-cols-4 gap-1.5 mb-1">
                                    {COR_OPTIONS.map(opt => (
                                        <button
                                            key={opt.label}
                                            onClick={() => { onChangeCor(opt.value); setShowColorPicker(false); }}
                                            className="w-7 h-7 rounded-full border border-gray-200 hover:scale-110 transition-transform"
                                            style={{ backgroundColor: opt.value || '#ffffff' }}
                                            title={opt.label}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Conteúdo expandido */}
            {expandable && isExpanded && (
                <div className="bg-gray-50 border-t border-gray-200">
                    <div className="pl-20 pr-4 py-3">
                        <p className="text-xs text-gray-500 font-medium mb-2">
                            {req.qtd === 'TODOS' ? 'Todas as variações exigidas:' : `${req.qtd} variação(ões) exigida(s):`}
                        </p>
                        <div className="space-y-1.5">
                            {Array.from({ length: getQtdNumber(req.qtd) }).map((_, i) => (
                                <div
                                    key={i}
                                    className="flex items-center gap-2 py-1.5 px-3 bg-white rounded border border-dashed border-gray-300"
                                >
                                    <span className="text-xs text-gray-400 font-mono w-4">{i + 1}.</span>
                                    <span className="text-xs text-gray-400 italic">Variação a definir...</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
