'use client';

import { useState } from 'react';
import { Conteudo, Status, Plataforma, TipoConteudo } from '@/types';
import { VideoCard, AddVideoCard } from './VideoCard';
import { StatusIcon, ChevronIcon, TrashIcon, PlusIcon } from './StatusIcon';

interface Grupo {
    id: string;
    tecnicaId: string;
    nome: string;
    status: Status;
    observacoes?: string;
}

interface GrupoContainerProps {
    grupo: Grupo;
    conteudos: Conteudo[];
    onUpdateStatus: (status: Status) => void;
    onRemoveGrupo: () => void;
    onAddConteudo: (data: { titulo: string; url: string; plataforma: Plataforma; tipo: TipoConteudo }) => void;
    onRemoveConteudo: (id: string) => void;
    onUpdateConteudoNotas: (id: string, notas: string) => void;
}

export function GrupoContainer({
    grupo,
    conteudos,
    onUpdateStatus,
    onRemoveGrupo,
    onAddConteudo,
    onRemoveConteudo,
    onUpdateConteudoNotas,
}: GrupoContainerProps) {
    const [isExpanded, setIsExpanded] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);

    // Form state para adicionar vídeo
    const [newVideoUrl, setNewVideoUrl] = useState('');
    const [newVideoTitle, setNewVideoTitle] = useState('');

    const statusColors: Record<Status, string> = {
        nao_sei: 'var(--red)',
        aprendendo: 'var(--yellow)',
        dominada: 'var(--green)',
    };

    // Detectar plataforma pela URL
    const detectPlatform = (url: string): Plataforma => {
        if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
        if (url.includes('tiktok.com')) return 'tiktok';
        if (url.includes('instagram.com')) return 'instagram';
        return 'outro';
    };

    const handleAddVideo = () => {
        if (!newVideoUrl.trim()) return;

        onAddConteudo({
            titulo: newVideoTitle.trim() || 'Vídeo sem título',
            url: newVideoUrl.trim(),
            plataforma: detectPlatform(newVideoUrl),
            tipo: 'didatico',
        });

        setNewVideoUrl('');
        setNewVideoTitle('');
        setShowAddForm(false);
    };

    return (
        <div className="grupo-container" style={{ borderLeftColor: statusColors[grupo.status] }}>
            {/* Header */}
            <div className="grupo-header" onClick={() => setIsExpanded(!isExpanded)}>
                <div className="grupo-header-left">
                    <span
                        className="grupo-status-dot"
                        style={{ backgroundColor: statusColors[grupo.status] }}
                    />
                    <span className="grupo-drag-handle">⋮⋮</span>
                    <h3 className="grupo-nome">{grupo.nome}</h3>
                </div>

                <div className="grupo-header-right">
                    <span className="grupo-video-count">📹 {conteudos.length}</span>

                    {/* Status buttons */}
                    <div className="grupo-status-buttons" onClick={(e) => e.stopPropagation()}>
                        {(['nao_sei', 'aprendendo', 'dominada'] as Status[]).map((status) => (
                            <button
                                key={status}
                                className={`grupo-status-btn ${grupo.status === status ? 'active' : ''}`}
                                onClick={() => onUpdateStatus(status)}
                                style={{
                                    borderColor: grupo.status === status ? statusColors[status] : 'transparent',
                                    backgroundColor: grupo.status === status ? `${statusColors[status]}20` : 'transparent'
                                }}
                            >
                                <StatusIcon status={status} variant="dot" size={14} />
                            </button>
                        ))}
                    </div>

                    <button
                        className="grupo-expand-btn"
                        onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
                    >
                        <ChevronIcon direction={isExpanded ? 'up' : 'down'} size={16} />
                    </button>

                    <button
                        className="grupo-menu-btn"
                        onClick={(e) => { e.stopPropagation(); onRemoveGrupo(); }}
                        title="Excluir grupo"
                    >
                        <TrashIcon size={14} />
                    </button>
                </div>
            </div>

            {/* Content */}
            {isExpanded && (
                <div className="grupo-content">
                    <div className="grupo-videos-grid">
                        {conteudos.map((conteudo) => (
                            <VideoCard
                                key={conteudo.id}
                                conteudo={conteudo}
                                onRemove={() => onRemoveConteudo(conteudo.id)}
                                onUpdateNotas={(notas) => onUpdateConteudoNotas(conteudo.id, notas)}
                            />
                        ))}

                        {/* Add Video Card */}
                        {showAddForm ? (
                            <div className="add-video-form-card">
                                <input
                                    type="text"
                                    placeholder="Título (opcional)"
                                    value={newVideoTitle}
                                    onChange={(e) => setNewVideoTitle(e.target.value)}
                                    className="add-video-input"
                                />
                                <input
                                    type="url"
                                    placeholder="Cole a URL do vídeo"
                                    value={newVideoUrl}
                                    onChange={(e) => setNewVideoUrl(e.target.value)}
                                    className="add-video-input"
                                    autoFocus
                                />
                                <div className="add-video-form-actions">
                                    <button
                                        className="btn-primary btn-small"
                                        onClick={handleAddVideo}
                                        disabled={!newVideoUrl.trim()}
                                    >
                                        Adicionar
                                    </button>
                                    <button
                                        className="btn-secondary btn-small"
                                        onClick={() => setShowAddForm(false)}
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <AddVideoCard onClick={() => setShowAddForm(true)} />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

// Botão para criar novo grupo
interface AddGrupoButtonProps {
    onAdd: (nome: string) => void;
}

export function AddGrupoButton({ onAdd }: AddGrupoButtonProps) {
    const [showForm, setShowForm] = useState(false);
    const [nome, setNome] = useState('');

    const handleSubmit = () => {
        if (nome.trim()) {
            onAdd(nome.trim());
            setNome('');
            setShowForm(false);
        }
    };

    if (showForm) {
        return (
            <div className="add-grupo-form">
                <input
                    type="text"
                    placeholder="Nome do grupo"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                    autoFocus
                />
                <button className="btn-primary btn-small" onClick={handleSubmit}>
                    Criar
                </button>
                <button className="btn-secondary btn-small" onClick={() => setShowForm(false)}>
                    Cancelar
                </button>
            </div>
        );
    }

    return (
        <button className="add-grupo-btn" onClick={() => setShowForm(true)}>
            <PlusIcon size={16} /> Novo Grupo
        </button>
    );
}
