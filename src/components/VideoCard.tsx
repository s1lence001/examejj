'use client';

import { useState } from 'react';
import { Conteudo, Plataforma } from '@/types';
import { PlayIcon, TrashIcon, LinkIcon, BookIcon } from './StatusIcon';

interface VideoCardProps {
    conteudo: Conteudo;
    onRemove: () => void;
    onUpdateNotas: (notas: string) => void;
}

// Extrai ID do YouTube da URL
function getYouTubeId(url: string): string | null {
    const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([^&\s?]+)/);
    return match ? match[1] : null;
}

// Gera URL do thumbnail do YouTube
function getYouTubeThumbnail(videoId: string): string {
    return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
}

// Badge de plataforma
function PlatformBadge({ platform }: { platform: Plataforma }) {
    const config: Record<Plataforma, { icon: string; bg: string }> = {
        youtube: { icon: '▶', bg: '#FF0000' },
        tiktok: { icon: '♪', bg: '#000000' },
        instagram: { icon: '📷', bg: '#E1306C' },
        outro: { icon: '🔗', bg: '#666666' },
    };

    const { icon, bg } = config[platform];

    return (
        <span className="platform-badge" style={{ backgroundColor: bg }}>
            {icon} {platform.charAt(0).toUpperCase() + platform.slice(1)}
        </span>
    );
}

export function VideoCard({ conteudo, onRemove, onUpdateNotas }: VideoCardProps) {
    const [showNotas, setShowNotas] = useState(false);
    const [notasValue, setNotasValue] = useState(conteudo.observacoes || '');

    const youtubeId = conteudo.plataforma === 'youtube' ? getYouTubeId(conteudo.url) : null;
    const thumbnailUrl = youtubeId ? getYouTubeThumbnail(youtubeId) : null;

    const handleNotasBlur = () => {
        if (notasValue !== conteudo.observacoes) {
            onUpdateNotas(notasValue);
        }
    };

    const handleOpenVideo = () => {
        window.open(conteudo.url, '_blank');
    };

    return (
        <div className="video-card">
            {/* Thumbnail ou placeholder */}
            <div className="video-card-thumbnail" onClick={handleOpenVideo}>
                {thumbnailUrl ? (
                    <img src={thumbnailUrl} alt={conteudo.titulo || 'Vídeo'} />
                ) : (
                    <div className="video-card-placeholder">
                        <PlayIcon size={32} />
                    </div>
                )}
                <PlatformBadge platform={conteudo.plataforma} />
            </div>

            {/* Info */}
            <div className="video-card-info">
                <h4 className="video-card-title">
                    {conteudo.titulo || 'Vídeo sem título'}
                </h4>
            </div>

            {/* Actions */}
            <div className="video-card-actions">
                <button
                    className={`video-card-btn ${showNotas ? 'active' : ''}`}
                    onClick={() => setShowNotas(!showNotas)}
                    title="Notas"
                >
                    <BookIcon size={14} /> Notas
                </button>
                <button
                    className="video-card-btn"
                    onClick={handleOpenVideo}
                    title="Abrir vídeo"
                >
                    <LinkIcon size={14} /> Abrir
                </button>
                <button
                    className="video-card-btn video-card-btn-danger"
                    onClick={onRemove}
                    title="Excluir"
                >
                    <TrashIcon size={14} />
                </button>
            </div>

            {/* Notas expandíveis */}
            {showNotas && (
                <div className="video-card-notas">
                    <textarea
                        value={notasValue}
                        onChange={(e) => setNotasValue(e.target.value)}
                        onBlur={handleNotasBlur}
                        placeholder="Suas anotações sobre este vídeo..."
                        rows={3}
                    />
                </div>
            )}
        </div>
    );
}

// Card para adicionar novo vídeo
interface AddVideoCardProps {
    onClick: () => void;
}

export function AddVideoCard({ onClick }: AddVideoCardProps) {
    return (
        <button className="add-video-card" onClick={onClick}>
            <span className="add-video-card-icon">+</span>
            <span className="add-video-card-text">Adicionar Vídeo</span>
        </button>
    );
}
