'use client';

import { useState } from 'react';
import { useExamData } from '@/hooks/useExamData';
import { TecnicaCard } from '@/components/TecnicaCard';
import { ProgressBar } from '@/components/ProgressBar';
import { ExportImport } from '@/components/ExportImport';
import { Categoria } from '@/types';

const categorias: Categoria[] = ['Fundamento', 'Raspagem', 'Finalização', 'Defesa', 'Passagem', 'Saída'];

export default function Home() {
  const { isLoaded, getTecnicasComStatus, getProgressoGeral, exportData, importData } = useExamData();
  const [filtroCategoria, setFiltroCategoria] = useState<Categoria | 'todas'>('todas');

  if (!isLoaded) {
    return <div className="loading">Carregando...</div>;
  }

  const tecnicas = getTecnicasComStatus();
  const progresso = getProgressoGeral();

  const tecnicasFiltradas = filtroCategoria === 'todas'
    ? tecnicas
    : tecnicas.filter(t => t.categoria === filtroCategoria);

  const tecnicasPorCategoria = categorias.map(cat => ({
    categoria: cat,
    tecnicas: tecnicasFiltradas.filter(t => t.categoria === cat),
  })).filter(g => g.tecnicas.length > 0);

  return (
    <main className="container">
      <header className="header">
        <div className="header-top">
          <h1>🥋 Exame Faixa Azul</h1>
          <ExportImport onExport={exportData} onImport={importData} />
        </div>

        <div className="progresso-geral">
          <div className="progresso-stats">
            <span className="stat">
              <strong>{progresso.dominadas}</strong> dominadas
            </span>
            <span className="stat">
              <strong>{progresso.aprendendo}</strong> aprendendo
            </span>
            <span className="stat">
              <strong>{progresso.pendentes}</strong> pendentes
            </span>
          </div>
          <div className="progresso-bar-wrapper">
            <ProgressBar value={progresso.dominadas} max={progresso.total} showLabel={false} />
            <span className="progresso-percent">{progresso.percentual}%</span>
          </div>
        </div>
      </header>

      <div className="filtros">
        <button
          className={`filtro-btn ${filtroCategoria === 'todas' ? 'active' : ''}`}
          onClick={() => setFiltroCategoria('todas')}
        >
          Todas ({tecnicas.length})
        </button>
        {categorias.map(cat => {
          const count = tecnicas.filter(t => t.categoria === cat).length;
          return (
            <button
              key={cat}
              className={`filtro-btn ${filtroCategoria === cat ? 'active' : ''}`}
              onClick={() => setFiltroCategoria(cat)}
            >
              {cat} ({count})
            </button>
          );
        })}
      </div>

      <div className="tecnicas-lista">
        {filtroCategoria === 'todas' ? (
          tecnicasPorCategoria.map(({ categoria, tecnicas }) => (
            <section key={categoria} className="categoria-section">
              <h2 className="categoria-titulo">{categoria}</h2>
              <div className="tecnicas-grid">
                {tecnicas.map(t => (
                  <TecnicaCard key={t.id} tecnica={t} />
                ))}
              </div>
            </section>
          ))
        ) : (
          <div className="tecnicas-grid">
            {tecnicasFiltradas.map(t => (
              <TecnicaCard key={t.id} tecnica={t} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
