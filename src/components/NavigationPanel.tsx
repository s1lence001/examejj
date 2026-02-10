'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TecnicaComStatus, Categoria } from '@/types';

const statusIcons = {
    nao_sei: '🔴',
    aprendendo: '🟡',
    dominada: '🟢',
};

const categoriaOrder: Categoria[] = [
    'Fundamento',
    'Raspagem',
    'Passagem',
    'Finalização',
    'Defesa',
    'Saída'
];

interface NavigationPanelProps {
    tecnicas: TecnicaComStatus[];
    currentTecnicaId: string;
}

export function NavigationPanel({ tecnicas, currentTecnicaId }: NavigationPanelProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [expandedCategorias, setExpandedCategorias] = useState<Set<string>>(new Set(categoriaOrder));
    const router = useRouter();

    const tecnicasByCategoria = categoriaOrder.reduce((acc, cat) => {
        acc[cat] = tecnicas.filter(t => t.categoria === cat);
        return acc;
    }, {} as Record<Categoria, TecnicaComStatus[]>);

    const toggleCategoria = (cat: string) => {
        const newSet = new Set(expandedCategorias);
        if (newSet.has(cat)) {
            newSet.delete(cat);
        } else {
            newSet.add(cat);
        }
        setExpandedCategorias(newSet);
    };

    const navigateToTecnica = (id: string) => {
        router.push(`/tecnica/${id}`);
    };

    const getCategoriaProgress = (cat: Categoria) => {
        const tecs = tecnicasByCategoria[cat];
        const dominadas = tecs.filter(t => t.status === 'dominada').length;
        return `${dominadas}/${tecs.length}`;
    };

    // Collapsed state - just a tab
    if (!isExpanded) {
        return (
            <div
                className="nav-panel collapsed"
                onClick={() => setIsExpanded(true)}
            >
                <div className="nav-tab">
                    <span className="nav-tab-icon">📋</span>
                    <span className="nav-tab-text">Técnicas</span>
                </div>
            </div>
        );
    }

    // Expanded state - full list
    return (
        <>
            <div className="nav-overlay" onClick={() => setIsExpanded(false)} />
            <aside className="nav-panel expanded">
                <div className="nav-header">
                    <h2>📋 Técnicas do Exame</h2>
                    <button
                        className="nav-close"
                        onClick={() => setIsExpanded(false)}
                    >
                        ✕
                    </button>
                </div>

                <div className="nav-list">
                    {categoriaOrder.map(cat => {
                        const tecs = tecnicasByCategoria[cat];
                        const isOpen = expandedCategorias.has(cat);

                        return (
                            <div key={cat} className="nav-categoria">
                                <button
                                    className="nav-categoria-header"
                                    onClick={() => toggleCategoria(cat)}
                                >
                                    <span className="nav-expand-icon">{isOpen ? '▼' : '▶'}</span>
                                    <span className="nav-categoria-name">{cat}</span>
                                    <span className="nav-categoria-progress">{getCategoriaProgress(cat)}</span>
                                </button>

                                {isOpen && (
                                    <div className="nav-tecnicas">
                                        {tecs.map(t => (
                                            <button
                                                key={t.id}
                                                className={`nav-tecnica-item ${t.id === currentTecnicaId ? 'active' : ''}`}
                                                onClick={() => navigateToTecnica(t.id)}
                                            >
                                                <span className="nav-tecnica-status">{statusIcons[t.status]}</span>
                                                <span className="nav-tecnica-name">{t.nome}</span>
                                                {t.qtdExigida !== null && (
                                                    <span className="nav-tecnica-progress">
                                                        {t.variacoesDominadas}/{typeof t.qtdExigida === 'number' ? t.qtdExigida : t.totalVariacoes}
                                                    </span>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </aside>
        </>
    );
}
