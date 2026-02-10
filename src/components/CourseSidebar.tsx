'use client';

import { useRouter } from 'next/navigation';
import { TecnicaComStatus, Categoria } from '@/types';
import { useState } from 'react';
import { StatusIcon } from './StatusIcon';



const categoriaOrder: Categoria[] = [
    'Fundamento',
    'Raspagem',
    'Passagem',
    'Finalização',
    'Defesa',
    'Saída'
];

interface CourseSidebarProps {
    tecnicas: TecnicaComStatus[];
    currentTecnicaId: string;
}

export function CourseSidebar({ tecnicas, currentTecnicaId }: CourseSidebarProps) {
    const router = useRouter();
    const [expandedCategorias, setExpandedCategorias] = useState<Set<string>>(
        new Set(categoriaOrder)
    );

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

    const getCategoriaProgress = (cat: Categoria) => {
        const tecs = tecnicasByCategoria[cat];
        const dominadas = tecs.filter(t => t.status === 'dominada').length;
        return { dominadas, total: tecs.length };
    };

    const getOverallProgress = () => {
        const dominadas = tecnicas.filter(t => t.status === 'dominada').length;
        return Math.round((dominadas / tecnicas.length) * 100);
    };

    return (
        <aside className="course-sidebar">
            <div className="sidebar-header">
                <h2>Conteúdo</h2>
                <div className="overall-progress">
                    <div className="progress-ring">
                        <span>{getOverallProgress()}%</span>
                    </div>
                </div>
            </div>

            <div className="sidebar-content">
                {categoriaOrder.map(cat => {
                    const tecs = tecnicasByCategoria[cat];
                    if (tecs.length === 0) return null;

                    const isOpen = expandedCategorias.has(cat);
                    const progress = getCategoriaProgress(cat);

                    return (
                        <div key={cat} className="module">
                            <button
                                className="module-header"
                                onClick={() => toggleCategoria(cat)}
                            >
                                <span className="module-toggle">{isOpen ? '▼' : '▶'}</span>
                                <div className="module-info">
                                    <span className="module-name">{cat}</span>
                                    <span className="module-progress">
                                        {progress.dominadas}/{progress.total} técnicas
                                    </span>
                                </div>
                            </button>

                            {isOpen && (
                                <div className="module-lessons">
                                    {tecs.map(t => {
                                        const isActive = t.id === currentTecnicaId;
                                        return (
                                            <button
                                                key={t.id}
                                                className={`lesson ${isActive ? 'active' : ''} status-${t.status}`}
                                                onClick={() => router.push(`/tecnica/${t.id}`)}
                                            >
                                                <span className={`lesson-status status-${t.status}`}>
                                                    <StatusIcon status={t.status} size={14} />
                                                </span>
                                                <span className="lesson-name">{t.nome}</span>
                                                {t.qtdExigida !== null && (
                                                    <span className="lesson-progress">
                                                        {t.variacoesDominadas}/{typeof t.qtdExigida === 'number' ? t.qtdExigida : t.totalVariacoes}
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </aside>
    );
}
