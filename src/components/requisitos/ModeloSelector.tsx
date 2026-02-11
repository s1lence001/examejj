'use client';

import { useState } from 'react';
import { ModeloRequisitos } from '@/types';

interface ModeloSelectorProps {
    modelos: ModeloRequisitos[];
    modeloAtivoId: string;
    isOriginal: boolean;
    onSelectModelo: (id: string) => void;
    onCriarModelo: (nome: string) => void;
    onRenomearModelo: (id: string, nome: string) => void;
    onDeletarModelo: (id: string) => void;
}

export default function ModeloSelector({
    modelos,
    modeloAtivoId,
    isOriginal,
    onSelectModelo,
    onCriarModelo,
    onRenomearModelo,
    onDeletarModelo,
}: ModeloSelectorProps) {
    const [showModal, setShowModal] = useState(false);
    const [nome, setNome] = useState('');
    const [editingName, setEditingName] = useState(false);
    const [editValue, setEditValue] = useState('');
    const [confirmDelete, setConfirmDelete] = useState(false);

    const modeloAtivo = modelos.find(m => m.id === modeloAtivoId);

    const handleCriar = () => {
        if (!nome.trim()) return;
        onCriarModelo(nome.trim());
        setNome('');
        setShowModal(false);
    };

    const handleRename = () => {
        if (editValue.trim()) {
            onRenomearModelo(modeloAtivoId, editValue.trim());
        }
        setEditingName(false);
    };

    return (
        <>
            <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <label className="text-sm font-semibold text-gray-700 whitespace-nowrap">Modelo:</label>
                <select
                    value={modeloAtivoId}
                    onChange={(e) => onSelectModelo(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900"
                >
                    {modelos.map(m => (
                        <option key={m.id} value={m.id}>
                            {m.tipo === 'original' ? '📄 ' : '✏️ '}{m.nome}
                            {m.tipo === 'original' ? ' (padrão)' : ''}
                        </option>
                    ))}
                </select>

                <button
                    onClick={() => setShowModal(true)}
                    className="px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors whitespace-nowrap"
                >
                    + Novo Modelo
                </button>

                {!isOriginal && (
                    <div className="flex gap-1">
                        <button
                            onClick={() => { setEditValue(modeloAtivo?.nome || ''); setEditingName(true); }}
                            className="px-2 py-2 text-gray-600 hover:text-blue-600 text-sm"
                            title="Renomear"
                        >
                            ✏️
                        </button>
                        <button
                            onClick={() => setConfirmDelete(true)}
                            className="px-2 py-2 text-gray-600 hover:text-red-600 text-sm"
                            title="Deletar"
                        >
                            🗑️
                        </button>
                    </div>
                )}
            </div>

            {isOriginal && (
                <div className="mb-4 p-2 bg-yellow-50 border border-yellow-200 rounded-md text-center">
                    <span className="text-sm text-yellow-800">
                        🔒 Modelo Original — somente leitura. Crie um novo modelo para personalizar.
                    </span>
                </div>
            )}

            {/* Modal Criar */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={() => setShowModal(false)}>
                    <div className="bg-white rounded-lg p-6 w-96 shadow-xl" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Criar Novo Modelo</h3>
                        <p className="text-sm text-gray-600 mb-4">
                            Será criada uma cópia do modelo original que você pode personalizar.
                        </p>
                        <input
                            type="text"
                            value={nome}
                            onChange={(e) => setNome(e.target.value)}
                            placeholder="Nome do modelo (ex: Treino Semanal)"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm mb-4 text-gray-900"
                            onKeyDown={(e) => e.key === 'Enter' && handleCriar()}
                            autoFocus
                        />
                        <div className="flex gap-2 justify-end">
                            <button onClick={() => { setShowModal(false); setNome(''); }} className="px-4 py-2 text-sm text-gray-600">Cancelar</button>
                            <button onClick={handleCriar} disabled={!nome.trim()} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50">Criar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Renomear */}
            {editingName && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={() => setEditingName(false)}>
                    <div className="bg-white rounded-lg p-6 w-96 shadow-xl" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Renomear Modelo</h3>
                        <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm mb-4 text-gray-900"
                            onKeyDown={(e) => e.key === 'Enter' && handleRename()}
                            autoFocus
                        />
                        <div className="flex gap-2 justify-end">
                            <button onClick={() => setEditingName(false)} className="px-4 py-2 text-sm text-gray-600">Cancelar</button>
                            <button onClick={handleRename} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700">Salvar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Deletar */}
            {confirmDelete && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={() => setConfirmDelete(false)}>
                    <div className="bg-white rounded-lg p-6 w-96 shadow-xl" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Deletar Modelo</h3>
                        <p className="text-sm text-gray-600 mb-4">
                            Tem certeza que deseja deletar <strong>{modeloAtivo?.nome}</strong>?
                        </p>
                        <div className="flex gap-2 justify-end">
                            <button onClick={() => setConfirmDelete(false)} className="px-4 py-2 text-sm text-gray-600">Cancelar</button>
                            <button onClick={() => { onDeletarModelo(modeloAtivoId); setConfirmDelete(false); }} className="px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700">Deletar</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
