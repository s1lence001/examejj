'use client';

import { useState } from 'react';
import { Conteudo, TipoConteudo, Plataforma } from '@/types';
import { BookIcon, SettingsIcon, RefreshIcon, LinkIcon } from './StatusIcon';

interface VideoEmbedProps {
    conteudo: Conteudo;
    onRemove: () => void;
}

function getYouTubeId(url: string): string | null {
    const pattern = /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([^&\s?]+)/;
    const match = url.match(pattern);
    return match ? match[1] : null;
}

function getYouTubeStartTime(url: string): number {
    if (!url) return 0;
    const match = url.match(/[?&]t=([^&]+)/);
    if (!match) return 0;

    const timeStr = match[1];
    if (/^\d+$/.test(timeStr)) return parseInt(timeStr);

    let totalSeconds = 0;
    const hMatch = timeStr.match(/(\d+)h/);
    const mMatch = timeStr.match(/(\d+)m/);
    const sMatch = timeStr.match(/(\d+)s/);

    if (hMatch) totalSeconds += parseInt(hMatch[1]) * 3600;
    if (mMatch) totalSeconds += parseInt(mMatch[1]) * 60;
    if (sMatch) totalSeconds += parseInt(sMatch[1]);

    return totalSeconds;
}

function getTikTokId(url: string): string | null {
    const match = url.match(/tiktok\.com\/@[^/]+\/video\/(\d+)/);
    return match ? match[1] : null;
}

export function VideoEmbed({ conteudo, onRemove }: VideoEmbedProps) {
    const tipoConfig: Record<TipoConteudo, { icon: React.ReactNode; label: string }> = {
        didatico: { icon: <BookIcon size={12} />, label: 'Didático' },
        ajuste_fino: { icon: <SettingsIcon size={12} />, label: 'Ajuste fino' },
        variacao: { icon: <RefreshIcon size={12} />, label: 'Variação' },
    };

    const tipo = tipoConfig[conteudo.tipo];
    const youtubeId = conteudo.plataforma === 'youtube' ? getYouTubeId(conteudo.url) : null;
    const youtubeStartTime = youtubeId ? getYouTubeStartTime(conteudo.url) : 0;
    const tiktokId = conteudo.plataforma === 'tiktok' ? getTikTokId(conteudo.url) : null;

    return (
        <div className="video-embed">
            <div className="video-embed-header">
                {conteudo.titulo && (
                    <span className="video-titulo">{conteudo.titulo}</span>
                )}
                <span className="video-tipo">{tipo.icon} {tipo.label}</span>
                <button className="btn-icon" onClick={onRemove} title="Remover">✕</button>
            </div>

            <div className="video-container">
                {youtubeId ? (
                    <iframe
                        src={`https://www.youtube.com/embed/${youtubeId}?autoplay=0${youtubeStartTime > 0 ? `&start=${youtubeStartTime}` : ''}`}
                        allowFullScreen
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    />
                ) : tiktokId ? (
                    <iframe
                        src={`https://www.tiktok.com/embed/v2/${tiktokId}`}
                        allowFullScreen
                    />
                ) : (
                    <a href={conteudo.url} target="_blank" rel="noopener noreferrer" className="video-link">
                        <LinkIcon size={16} /> Abrir link externo
                    </a>
                )}
            </div>

            {conteudo.observacoes && (
                <p className="video-obs">{conteudo.observacoes}</p>
            )}
        </div>
    );
}

interface AddConteudoFormProps {
    onAdd: (data: { titulo: string; url: string; plataforma: Plataforma; tipo: TipoConteudo; observacoes: string }) => void;
    onCancel: () => void;
}

export function AddConteudoForm({ onAdd, onCancel }: AddConteudoFormProps) {
    const [titulo, setTitulo] = useState('');
    const [url, setUrl] = useState('');
    const [tipo, setTipo] = useState<TipoConteudo>('didatico');
    const [observacoes, setObservacoes] = useState('');

    const detectPlataforma = (url: string): Plataforma => {
        if (url.includes('tiktok.com')) return 'tiktok';
        return 'youtube';
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!url.trim()) return;

        onAdd({
            titulo: titulo.trim(),
            url: url.trim(),
            plataforma: detectPlataforma(url),
            tipo,
            observacoes: observacoes.trim(),
        });
    };

    return (
        <form className="add-conteudo-form" onSubmit={handleSubmit}>
            <input
                type="text"
                placeholder="Nome do conteúdo (ex: Osoto Gari)"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
            />

            <input
                type="url"
                placeholder="Cole o link do YouTube ou TikTok"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
            />



            <textarea
                placeholder="Observações (opcional)"
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                rows={2}
            />

            <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={onCancel}>Cancelar</button>
                <button type="submit" className="btn-primary">Adicionar</button>
            </div>
        </form>
    );
}
