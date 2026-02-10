'use client';

import { useState } from 'react';
import { useExamData } from '@/hooks/useExamData';
import { useAuth } from '@/hooks/useAuth';
import { AuthGuard } from '@/components/AuthGuard';
import { TecnicaCard } from '@/components/TecnicaCard';
import { ProgressBar } from '@/components/ProgressBar';
import { ExportImport } from '@/components/ExportImport';
import { JiuJitsuLogo } from '@/components/StatusIcon';
import { Categoria } from '@/types';

const categorias: Categoria[] = ['Fundamento', 'Raspagem', 'Finalização', 'Defesa', 'Passagem', 'Saída'];

function HomeContent() {
  const { isLoaded, getTecnicasComStatus, getProgressoGeral, exportData, importData } = useExamData();
  const { user, signOut } = useAuth();
  const [filtroCategoria, setFiltroCategoria] = useState<Categoria | 'todas'>('todas');

  if (!isLoaded) {
    return <div className="loading">Carregando dados...</div>;
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
    <main className="container animate-fadeIn">
      <header className="header">
        <div className="header-top">
          <h1 className="logo-title"><JiuJitsuLogo size={28} className="logo-icon" /> Exame Faixa Azul</h1>
          <div className="header-actions">
            <ExportImport onExport={exportData} onImport={importData} />
            <button className="btn-secondary btn-small" onClick={signOut}>
              Sair
            </button>
          </div>
        </div>

        <p className="user-email">{user?.email}</p>

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

export default function Home() {
  return (
    <AuthGuard>
      <HomeContent />
    </AuthGuard>
  );
}
