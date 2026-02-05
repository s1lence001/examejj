'use client';

import { Variacao, Status, Conteudo } from '@/types';
import { useState } from 'react';
import { VideoEmbed, AddConteudoForm } from './VideoEmbed';

interface VariacaoItemProps {
    variacao: Variacao;
    conteudos: Conteudo[];
    onUpdateStatus: (status: Status) => void;
    onUpdateObservacoes: (obs: string) => void;
    onRemove: () => void;
    onAddConteudo: (data: { url: string; plataforma: 'youtube' | 'tiktok'; tipo: 'didatico' | 'ajuste_fino' | 'variacao'; observacoes: string }) => void;
    onRemoveConteudo: (id: string) => void;
}

const statusConfig: Record<Status, { icon: string; label: string; className: string }> = {
    nao_sei: { icon: '❌', label: 'Não sei', className: 'status-nao-sei' },
    aprendendo: { icon: '⚠️', label: 'Aprendendo', className: 'status-aprendendo' },
    dominada: { icon: '✅', label: 'Dominada', className: 'status-dominada' },
};

export function VariacaoItem({
    variacao,
    conteudos,
    onUpdateStatus,
    onUpdateObservacoes,
    onRemove,
    onAddConteudo,
    onRemoveConteudo,
}: VariacaoItemProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [showAddConteudo, setShowAddConteudo] = useState(false);
    const [editingObs, setEditingObs] = useState(false);
    const [obsValue, setObsValue] = useState(variacao.observacoes);

    const config = statusConfig[variacao.status];

    const handleSaveObs = () => {
        onUpdateObservacoes(obsValue);
        setEditingObs(false);
    };

    return (
        <div className={`variacao-item ${config.className}`}>
            <div className="variacao-header">
                <button
                    className="variacao-expand"
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    {isExpanded ? '▼' : '▶'}
                </button>

                <span className="variacao-nome">{variacao.nome}</span>

                <div className="variacao-status-buttons">
                    {(['nao_sei', 'aprendendo', 'dominada'] as Status[]).map((status) => (
                        <button
                            key={status}
                            className={`status-btn ${variacao.status === status ? 'active' : ''}`}
                            onClick={() => onUpdateStatus(status)}
                            title={statusConfig[status].label}
                        >
                            {statusConfig[status].icon}
                        </button>
                    ))}
                </div>

                <button className="btn-icon btn-remove" onClick={onRemove} title="Remover variação">
                    🗑️
                </button>
            </div>

            {isExpanded && (
                <div className="variacao-content">
                    <div className="variacao-obs">
                        {editingObs ? (
                            <div className="obs-edit">
                                <textarea
                                    value={obsValue}
                                    onChange={(e) => setObsValue(e.target.value)}
                                    placeholder="Observações sobre esta variação..."
                                    rows={2}
                                />
                                <div className="obs-actions">
                                    <button className="btn-small" onClick={() => setEditingObs(false)}>Cancelar</button>
                                    <button className="btn-small btn-primary" onClick={handleSaveObs}>Salvar</button>
                                </div>
                            </div>
                        ) : (
                            <p onClick={() => setEditingObs(true)} className="obs-text">
                                {variacao.observacoes || 'Clique para adicionar observações...'}
                            </p>
                        )}
                    </div>

                    <div className="variacao-conteudos">
                        <div className="conteudos-header">
                            <h4>Conteúdos ({conteudos.length})</h4>
                            <button
                                className="btn-small"
                                onClick={() => setShowAddConteudo(true)}
                            >
                                + Adicionar
                            </button>
                        </div>

                        {showAddConteudo && (
                            <AddConteudoForm
                                onAdd={(data) => {
                                    onAddConteudo(data);
                                    setShowAddConteudo(false);
                                }}
                                onCancel={() => setShowAddConteudo(false)}
                            />
                        )}

                        {conteudos.map((c) => (
                            <VideoEmbed
                                key={c.id}
                                conteudo={c}
                                onRemove={() => onRemoveConteudo(c.id)}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

interface AddVariacaoFormProps {
    onAdd: (nome: string) => void;
    onCancel: () => void;
}

export function AddVariacaoForm({ onAdd, onCancel }: AddVariacaoFormProps) {
    const [nome, setNome] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!nome.trim()) return;
        onAdd(nome.trim());
    };

    return (
        <form className="add-variacao-form" onSubmit={handleSubmit}>
            <input
                type="text"
                placeholder="Nome da variação"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
                autoFocus
            />
            <button type="button" className="btn-secondary" onClick={onCancel}>Cancelar</button>
            <button type="submit" className="btn-primary">Adicionar</button>
        </form>
    );
}
