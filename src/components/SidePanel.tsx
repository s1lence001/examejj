'use client';

import { useState } from 'react';
import { TecnicaComStatus, Variacao, Conteudo, Status } from '@/types';
import { VideoEmbed, AddConteudoForm } from './VideoEmbed';
import { StatusIcon, ChevronIcon, TrashIcon, PlusIcon, PlayIcon } from './StatusIcon';

const statusConfig = {
    nao_sei: { label: 'Não sei', className: 'status-nao-sei' },
    aprendendo: { label: 'Aprendendo', className: 'status-aprendendo' },
    dominada: { label: 'Dominada', className: 'status-dominada' },
};

interface SidePanelProps {
    tecnica: TecnicaComStatus;
    variacoes: Variacao[];
    getConteudos: (tecnicaId?: string, variacaoId?: string) => Conteudo[];
    onUpdateVariacaoStatus: (id: string, status: Status) => void;
    onUpdateVariacaoObservacoes: (id: string, obs: string) => void;
    onRemoveVariacao: (id: string) => void;
    onAddVariacao: (nome: string) => void;
    onAddConteudo: (data: Omit<Conteudo, 'id'>) => void;
    onRemoveConteudo: (id: string) => void;
    onUpdateTecnicaStatusManual?: (status: Status) => void;
    onUpdateObservacoes: (obs: string) => void;
}

export function SidePanel({
    tecnica,
    variacoes,
    getConteudos,
    onUpdateVariacaoStatus,
    onUpdateVariacaoObservacoes,
    onRemoveVariacao,
    onAddVariacao,
    onAddConteudo,
    onRemoveConteudo,
    onUpdateTecnicaStatusManual,
    onUpdateObservacoes,
}: SidePanelProps) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [expandedVariacoes, setExpandedVariacoes] = useState<Set<string>>(new Set());
    const [showAddVariacao, setShowAddVariacao] = useState(false);
    const [newVariacaoName, setNewVariacaoName] = useState('');
    const [addingConteudoTo, setAddingConteudoTo] = useState<string | null>(null);
    const [editingObs, setEditingObs] = useState(false);
    const [obsValue, setObsValue] = useState(tecnica.observacoes);

    const config = statusConfig[tecnica.status];
    const isFundamentoTeorico = tecnica.qtdExigida === null;

    const toggleVariacao = (id: string) => {
        const newSet = new Set(expandedVariacoes);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setExpandedVariacoes(newSet);
    };

    const handleAddVariacao = () => {
        if (newVariacaoName.trim()) {
            onAddVariacao(newVariacaoName.trim());
            setNewVariacaoName('');
            setShowAddVariacao(false);
        }
    };

    const getProgressLabel = () => {
        if (tecnica.qtdExigida === null) return 'Teórica';
        if (tecnica.qtdExigida === 'TODOS') return `${tecnica.variacoesDominadas}/${tecnica.totalVariacoes} (Todas)`;
        return `${tecnica.variacoesDominadas}/${tecnica.qtdExigida}`;
    };

    if (isCollapsed) {
        return (
            <div className="side-panel collapsed">
                <button
                    className="panel-toggle"
                    onClick={() => setIsCollapsed(false)}
                    title="Expandir painel"
                >
                    ◀
                </button>
            </div>
        );
    }

    return (
        <aside className="side-panel">
            <div className="panel-header">
                <button
                    className="panel-toggle"
                    onClick={() => setIsCollapsed(true)}
                    title="Recolher painel"
                >
                    ▶
                </button>

                <div className="panel-info">
                    <span className="panel-categoria">{tecnica.categoria}</span>
                    <h2 className="panel-title">{tecnica.nome}</h2>
                    <div className="panel-status-row">
                        <span className={`status-badge ${config.className}`}>
                            <StatusIcon status={tecnica.status} variant="dot" size={12} /> {config.label}
                        </span>
                        <span className="panel-progress">{getProgressLabel()}</span>
                    </div>
                </div>
            </div>

            {isFundamentoTeorico && onUpdateTecnicaStatusManual && (
                <div className="panel-section">
                    <h3>Status Manual</h3>
                    <div className="status-buttons-row">
                        {(['nao_sei', 'aprendendo', 'dominada'] as Status[]).map((status) => (
                            <button
                                key={status}
                                className={`status-btn-small ${tecnica.status === status ? 'active' : ''} ${statusConfig[status].className}`}
                                onClick={() => onUpdateTecnicaStatusManual(status)}
                            >
                                <StatusIcon status={status} variant="dot" size={16} />
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {!isFundamentoTeorico && (
                <div className="panel-section">
                    <div className="section-header-small">
                        <h3>Variações ({variacoes.length})</h3>
                        <button
                            className="btn-add-small"
                            onClick={() => setShowAddVariacao(true)}
                        >
                            +
                        </button>
                    </div>

                    {showAddVariacao && (
                        <div className="add-variacao-inline">
                            <input
                                type="text"
                                value={newVariacaoName}
                                onChange={(e) => setNewVariacaoName(e.target.value)}
                                placeholder="Nome da variação"
                                autoFocus
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleAddVariacao();
                                    if (e.key === 'Escape') setShowAddVariacao(false);
                                }}
                            />
                            <button className="btn-confirm-small" onClick={handleAddVariacao}>✓</button>
                            <button className="btn-cancel-small" onClick={() => setShowAddVariacao(false)}>✕</button>
                        </div>
                    )}

                    <div className="variacoes-list">
                        {variacoes.map((v) => {
                            const vConfig = statusConfig[v.status];
                            const isExpanded = expandedVariacoes.has(v.id);
                            const vConteudos = getConteudos(undefined, v.id);

                            return (
                                <div key={v.id} className={`variacao-item-compact ${vConfig.className}`}>
                                    <div className="variacao-row" onClick={() => toggleVariacao(v.id)}>
                                        <span className="variacao-expand-icon">
                                            <ChevronIcon direction={isExpanded ? 'down' : 'right'} size={14} />
                                        </span>
                                        <span className="variacao-name">{v.nome}</span>
                                        <div className="variacao-status-buttons" onClick={(e) => e.stopPropagation()}>
                                            {(['nao_sei', 'aprendendo', 'dominada'] as Status[]).map((status) => (
                                                <button
                                                    key={status}
                                                    className={`status-dot ${v.status === status ? 'active' : ''} ${statusConfig[status].className}`}
                                                    onClick={() => onUpdateVariacaoStatus(v.id, status)}
                                                    title={statusConfig[status].label}
                                                >
                                                    <StatusIcon status={status} variant="dot" size={16} />
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {isExpanded && (
                                        <div className="variacao-expanded">
                                            <textarea
                                                className="variacao-obs-input"
                                                value={v.observacoes}
                                                onChange={(e) => onUpdateVariacaoObservacoes(v.id, e.target.value)}
                                                placeholder="Observações..."
                                                rows={2}
                                            />

                                            <div className="variacao-conteudos">
                                                {vConteudos.length > 0 && (
                                                    <div className="conteudos-mini">
                                                        {vConteudos.map((c) => (
                                                            <div key={c.id} className="conteudo-mini">
                                                                <a href={c.url} target="_blank" rel="noopener noreferrer">
                                                                    {c.plataforma === 'youtube' ? '▶️' : '🎵'} {c.tipo}
                                                                </a>
                                                                <button
                                                                    className="btn-remove-mini"
                                                                    onClick={() => onRemoveConteudo(c.id)}
                                                                >
                                                                    ✕
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                {addingConteudoTo === v.id ? (
                                                    <AddConteudoForm
                                                        onAdd={(data) => {
                                                            onAddConteudo({ ...data, variacaoId: v.id });
                                                            setAddingConteudoTo(null);
                                                        }}
                                                        onCancel={() => setAddingConteudoTo(null)}
                                                    />
                                                ) : (
                                                    <button
                                                        className="btn-add-conteudo"
                                                        onClick={() => setAddingConteudoTo(v.id)}
                                                    >
                                                        + Conteúdo
                                                    </button>
                                                )}
                                            </div>

                                            <button
                                                className="btn-remove-variacao"
                                                onClick={() => onRemoveVariacao(v.id)}
                                            >
                                                🗑️ Remover
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        {variacoes.length === 0 && !showAddVariacao && (
                            <p className="empty-text-small">Nenhuma variação</p>
                        )}
                    </div>
                </div>
            )}

            <div className="panel-section">
                <h3>Observações Rápidas</h3>
                {editingObs ? (
                    <div className="obs-edit-inline">
                        <textarea
                            value={obsValue}
                            onChange={(e) => setObsValue(e.target.value)}
                            rows={3}
                            autoFocus
                        />
                        <div className="obs-actions-inline">
                            <button className="btn-cancel-small" onClick={() => setEditingObs(false)}>Cancelar</button>
                            <button className="btn-confirm-small" onClick={() => {
                                onUpdateObservacoes(obsValue);
                                setEditingObs(false);
                            }}>Salvar</button>
                        </div>
                    </div>
                ) : (
                    <p
                        className="obs-preview"
                        onClick={() => {
                            setObsValue(tecnica.observacoes);
                            setEditingObs(true);
                        }}
                    >
                        {tecnica.observacoes || 'Clique para adicionar...'}
                    </p>
                )}
            </div>
        </aside>
    );
}
