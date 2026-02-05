'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useExamData } from '@/hooks/useExamData';
import { AuthGuard } from '@/components/AuthGuard';
import { SidePanel } from '@/components/SidePanel';
import { VideoEmbed, AddConteudoForm } from '@/components/VideoEmbed';

function TecnicaContent() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const {
        isLoaded,
        getTecnica,
        getVariacoes,
        getConteudos,
        addVariacao,
        updateVariacao,
        removeVariacao,
        updateTecnicaStatusManual,
        updateTecnicaObservacoes,
        addConteudo,
        removeConteudo,
    } = useExamData();

    const [showAddConteudo, setShowAddConteudo] = useState(false);

    if (!isLoaded) {
        return <div className="loading">Carregando...</div>;
    }

    const tecnica = getTecnica(id);

    if (!tecnica) {
        return (
            <div className="container">
                <p>Técnica não encontrada</p>
                <button onClick={() => router.push('/')}>Voltar</button>
            </div>
        );
    }

    const variacoes = getVariacoes(id);
    const conteudosTecnica = getConteudos(id);

    return (
        <div className="tecnica-layout">
            {/* Área Principal (Esquerda) */}
            <main className="main-content">
                <button className="btn-back" onClick={() => router.push('/')}>
                    ← Voltar ao Dashboard
                </button>

                <header className="main-header">
                    <h1>{tecnica.nome}</h1>
                    <p className="main-subtitle">
                        {tecnica.qtdExigida === null
                            ? 'Conteúdo teórico para estudo e revisão'
                            : `Estude as variações e marque seu progresso no painel lateral`
                        }
                    </p>
                </header>

                {/* Seção de Vídeos Principais */}
                <section className="content-section">
                    <div className="section-header">
                        <h2>📺 Conteúdos de Estudo</h2>
                        <button
                            className="btn-primary"
                            onClick={() => setShowAddConteudo(true)}
                        >
                            + Adicionar Vídeo
                        </button>
                    </div>

                    {showAddConteudo && (
                        <AddConteudoForm
                            onAdd={(data) => {
                                addConteudo({ ...data, tecnicaId: id });
                                setShowAddConteudo(false);
                            }}
                            onCancel={() => setShowAddConteudo(false)}
                        />
                    )}

                    {conteudosTecnica.length === 0 ? (
                        <div className="empty-state">
                            <p>Nenhum vídeo adicionado ainda.</p>
                            <p className="hint">Adicione vídeos do YouTube ou TikTok para estudar esta técnica.</p>
                        </div>
                    ) : (
                        <div className="videos-grid">
                            {conteudosTecnica.map((c) => (
                                <VideoEmbed
                                    key={c.id}
                                    conteudo={c}
                                    onRemove={() => removeConteudo(c.id)}
                                />
                            ))}
                        </div>
                    )}
                </section>

                {/* Área de Estudo/Revisão */}
                <section className="content-section">
                    <h2>📝 Área de Estudo</h2>
                    <div className="study-area">
                        <p className="study-placeholder">
                            Use esta área para fazer anotações, revisar conceitos e praticar mentalmente a técnica.
                        </p>
                        {tecnica.qtdExigida !== null && (
                            <div className="study-tips">
                                <h4>Dicas:</h4>
                                <ul>
                                    <li>Assista os vídeos com atenção aos detalhes</li>
                                    <li>Marque as variações que já domina no painel lateral</li>
                                    <li>Pratique cada variação até se sentir confiante</li>
                                </ul>
                            </div>
                        )}
                    </div>
                </section>
            </main>

            {/* Painel Lateral (Direita) */}
            <SidePanel
                tecnica={tecnica}
                variacoes={variacoes}
                getConteudos={getConteudos}
                onUpdateVariacaoStatus={(vId, status) => updateVariacao(vId, { status })}
                onUpdateVariacaoObservacoes={(vId, obs) => updateVariacao(vId, { observacoes: obs })}
                onRemoveVariacao={removeVariacao}
                onAddVariacao={(nome) => addVariacao({
                    tecnicaId: id,
                    nome,
                    status: 'nao_sei',
                    observacoes: '',
                })}
                onAddConteudo={addConteudo}
                onRemoveConteudo={removeConteudo}
                onUpdateTecnicaStatusManual={tecnica.qtdExigida === null ? (status) => updateTecnicaStatusManual(id, status) : undefined}
                onUpdateObservacoes={(obs) => updateTecnicaObservacoes(id, obs)}
            />
        </div>
    );
}

export default function TecnicaPage() {
    return (
        <AuthGuard>
            <TecnicaContent />
        </AuthGuard>
    );
}
