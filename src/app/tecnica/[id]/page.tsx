'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useExamData } from '@/hooks/useExamData';
import { AuthGuard } from '@/components/AuthGuard';
import { VariacaoItem, AddVariacaoForm } from '@/components/VariacaoItem';
import { VideoEmbed, AddConteudoForm } from '@/components/VideoEmbed';
import { Status } from '@/types';

const statusConfig = {
    nao_sei: { icon: '🔴', label: 'Não sei', className: 'status-nao-sei' },
    aprendendo: { icon: '🟡', label: 'Aprendendo', className: 'status-aprendendo' },
    dominada: { icon: '🟢', label: 'Dominada', className: 'status-dominada' },
};

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

    const [showAddVariacao, setShowAddVariacao] = useState(false);
    const [showAddConteudo, setShowAddConteudo] = useState(false);
    const [editingObs, setEditingObs] = useState(false);
    const [obsValue, setObsValue] = useState('');

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
    const config = statusConfig[tecnica.status];
    const isFundamentoTeorico = tecnica.qtdExigida === null;

    const handleAddVariacao = (nome: string) => {
        addVariacao({
            tecnicaId: id,
            nome,
            status: 'nao_sei',
            observacoes: '',
        });
        setShowAddVariacao(false);
    };

    const handleSaveObs = () => {
        updateTecnicaObservacoes(id, obsValue);
        setEditingObs(false);
    };

    const getQtdLabel = () => {
        if (tecnica.qtdExigida === null) return 'Conteúdo teórico';
        if (tecnica.qtdExigida === 'TODOS') return `Exigido: TODAS as variações (${tecnica.variacoesDominadas}/${tecnica.totalVariacoes})`;
        return `Exigido: ${tecnica.qtdExigida} variação(ões) - Dominadas: ${tecnica.variacoesDominadas}`;
    };

    return (
        <main className="container">
            <button className="btn-back" onClick={() => router.push('/')}>
                ← Voltar
            </button>

            <header className="tecnica-header">
                <div className="tecnica-status-badge">
                    <span className={`status-badge ${config.className}`}>
                        {config.icon} {config.label}
                    </span>
                    <span className="tecnica-categoria">{tecnica.categoria}</span>
                </div>
                <h1>{tecnica.nome}</h1>
                <p className="tecnica-qtd-info">{getQtdLabel()}</p>
            </header>

            {isFundamentoTeorico && (
                <section className="section">
                    <h2>Status</h2>
                    <p className="info-text">Esta é uma técnica teórica. Marque o status manualmente:</p>
                    <div className="status-manual-buttons">
                        {(['nao_sei', 'aprendendo', 'dominada'] as Status[]).map((status) => (
                            <button
                                key={status}
                                className={`status-btn-large ${tecnica.status === status ? 'active' : ''} ${statusConfig[status].className}`}
                                onClick={() => updateTecnicaStatusManual(id, status)}
                            >
                                {statusConfig[status].icon} {statusConfig[status].label}
                            </button>
                        ))}
                    </div>
                </section>
            )}

            <section className="section">
                <h2>Observações</h2>
                {editingObs ? (
                    <div className="obs-edit">
                        <textarea
                            value={obsValue}
                            onChange={(e) => setObsValue(e.target.value)}
                            placeholder="Anotações pessoais sobre esta técnica..."
                            rows={3}
                            autoFocus
                        />
                        <div className="obs-actions">
                            <button className="btn-secondary" onClick={() => setEditingObs(false)}>Cancelar</button>
                            <button className="btn-primary" onClick={handleSaveObs}>Salvar</button>
                        </div>
                    </div>
                ) : (
                    <p
                        className="obs-text clickable"
                        onClick={() => {
                            setObsValue(tecnica.observacoes);
                            setEditingObs(true);
                        }}
                    >
                        {tecnica.observacoes || 'Clique para adicionar observações...'}
                    </p>
                )}
            </section>

            {!isFundamentoTeorico && (
                <section className="section">
                    <div className="section-header">
                        <h2>Variações ({variacoes.length})</h2>
                        <button className="btn-primary" onClick={() => setShowAddVariacao(true)}>
                            + Adicionar
                        </button>
                    </div>

                    {showAddVariacao && (
                        <AddVariacaoForm
                            onAdd={handleAddVariacao}
                            onCancel={() => setShowAddVariacao(false)}
                        />
                    )}

                    {variacoes.length === 0 ? (
                        <p className="empty-text">Nenhuma variação cadastrada. Adicione a primeira!</p>
                    ) : (
                        <div className="variacoes-lista">
                            {variacoes.map((v) => (
                                <VariacaoItem
                                    key={v.id}
                                    variacao={v}
                                    conteudos={getConteudos(undefined, v.id)}
                                    onUpdateStatus={(status) => updateVariacao(v.id, { status })}
                                    onUpdateObservacoes={(obs) => updateVariacao(v.id, { observacoes: obs })}
                                    onRemove={() => removeVariacao(v.id)}
                                    onAddConteudo={(data) => addConteudo({ ...data, variacaoId: v.id })}
                                    onRemoveConteudo={removeConteudo}
                                />
                            ))}
                        </div>
                    )}
                </section>
            )}

            <section className="section">
                <div className="section-header">
                    <h2>Conteúdos da Técnica ({conteudosTecnica.length})</h2>
                    <button className="btn-primary" onClick={() => setShowAddConteudo(true)}>
                        + Adicionar
                    </button>
                </div>

                <p className="info-text">
                    Vídeos e links sobre a técnica em geral (não específicos de uma variação).
                </p>

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
                    <p className="empty-text">Nenhum conteúdo cadastrado para esta técnica.</p>
                ) : (
                    <div className="conteudos-grid">
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
        </main>
    );
}

export default function TecnicaPage() {
    return (
        <AuthGuard>
            <TecnicaContent />
        </AuthGuard>
    );
}
