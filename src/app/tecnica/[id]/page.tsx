'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useMemo } from 'react';
import { useExamData } from '@/hooks/useExamData';
import { AuthGuard } from '@/components/AuthGuard';
import { CourseSidebar } from '@/components/CourseSidebar';
import { StatusIcon, ChevronIcon } from '@/components/StatusIcon';
import { Status, Conteudo, Plataforma, TipoConteudo, Variacao } from '@/types';

// Shadcn components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

// Lucide icons
import { Plus, Trash2, ExternalLink, FileText, ChevronDown, ChevronUp, GripVertical, Play, Youtube } from 'lucide-react';

const statusConfig = {
    nao_sei: { label: 'Não sei', color: 'bg-red-500', textColor: 'text-red-500' },
    aprendendo: { label: 'Aprendendo', color: 'bg-yellow-500', textColor: 'text-yellow-500' },
    dominada: { label: 'Dominada', color: 'bg-green-500', textColor: 'text-green-500' },
};

// Detectar plataforma
function detectPlatform(url: string): Plataforma {
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
    if (url.includes('tiktok.com')) return 'tiktok';
    if (url.includes('instagram.com')) return 'instagram';
    return 'outro';
}

// Thumbnail do YouTube
function getYouTubeThumbnail(url: string): string | null {
    const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&\s]+)/);
    return match ? `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg` : null;
}

// Componente VideoCard com Shadcn
function VideoCard({
    conteudo,
    onRemove,
    onUpdateNotas
}: {
    conteudo: Conteudo;
    onRemove: () => void;
    onUpdateNotas: (notas: string) => void;
}) {
    const [showNotas, setShowNotas] = useState(false);
    const [notasValue, setNotasValue] = useState(conteudo.observacoes || '');
    const thumbnail = getYouTubeThumbnail(conteudo.url);

    const handleNotasBlur = () => {
        if (notasValue !== conteudo.observacoes) {
            onUpdateNotas(notasValue);
        }
    };

    return (
        <Card className="group overflow-hidden bg-card hover:border-primary/50 transition-all">
            {/* Thumbnail */}
            <div
                className="relative aspect-video bg-muted cursor-pointer overflow-hidden"
                onClick={() => window.open(conteudo.url, '_blank')}
            >
                {thumbnail ? (
                    <img src={thumbnail} alt={conteudo.titulo || 'Vídeo'} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <Play className="w-12 h-12 text-muted-foreground" />
                    </div>
                )}
                <Badge className="absolute top-2 left-2 bg-red-600 text-white">
                    <Youtube className="w-3 h-3 mr-1" />
                    {conteudo.plataforma}
                </Badge>
            </div>

            <CardContent className="p-3">
                <h4 className="font-medium text-sm truncate mb-2">
                    {conteudo.titulo || 'Vídeo sem título'}
                </h4>

                <div className="flex gap-1">
                    <Button
                        variant={showNotas ? "secondary" : "ghost"}
                        size="sm"
                        className="flex-1 h-8 text-xs"
                        onClick={() => setShowNotas(!showNotas)}
                    >
                        <FileText className="w-3 h-3 mr-1" /> Notas
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1 h-8 text-xs"
                        onClick={() => window.open(conteudo.url, '_blank')}
                    >
                        <ExternalLink className="w-3 h-3 mr-1" /> Abrir
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:bg-destructive/10"
                        onClick={onRemove}
                    >
                        <Trash2 className="w-3 h-3" />
                    </Button>
                </div>

                {showNotas && (
                    <Textarea
                        value={notasValue}
                        onChange={(e) => setNotasValue(e.target.value)}
                        onBlur={handleNotasBlur}
                        placeholder="Suas anotações..."
                        className="mt-2 text-xs min-h-[60px]"
                    />
                )}
            </CardContent>
        </Card>
    );
}

// Componente GrupoCard com Shadcn
function GrupoCard({
    grupo,
    conteudos,
    onUpdateStatus,
    onRemoveGrupo,
    onAddConteudo,
    onRemoveConteudo,
    onUpdateConteudoNotas,
    onUpdateObservacoes,
}: {
    grupo: Variacao;
    conteudos: Conteudo[];
    onUpdateStatus: (status: Status) => void;
    onRemoveGrupo: () => void;
    onAddConteudo: (data: { titulo: string; url: string; plataforma: Plataforma; tipo: TipoConteudo }) => void;
    onRemoveConteudo: (id: string) => void;
    onUpdateConteudoNotas: (id: string, notas: string) => void;
    onUpdateObservacoes: (obs: string) => void;
}) {
    const [isOpen, setIsOpen] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newVideoUrl, setNewVideoUrl] = useState('');
    const [newVideoTitle, setNewVideoTitle] = useState('');

    const config = statusConfig[grupo.status];

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
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <Card className={`border-l-4`} style={{ borderLeftColor: grupo.status === 'nao_sei' ? '#ef4444' : grupo.status === 'aprendendo' ? '#eab308' : '#22c55e' }}>
                <CardHeader className="p-4 pb-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                            <div className={`w-3 h-3 rounded-full ${config.color}`} />
                            <CardTitle className="text-base font-semibold">{grupo.nome}</CardTitle>
                            <Badge variant="secondary" className="text-xs">
                                {conteudos.length} vídeos
                            </Badge>
                        </div>

                        <div className="flex items-center gap-2">
                            {/* Status buttons */}
                            <div className="flex gap-1">
                                {(['nao_sei', 'aprendendo', 'dominada'] as Status[]).map((status) => (
                                    <Button
                                        key={status}
                                        variant={grupo.status === status ? "default" : "ghost"}
                                        size="icon"
                                        className={`h-7 w-7 ${grupo.status === status ? statusConfig[status].color : ''}`}
                                        onClick={() => onUpdateStatus(status)}
                                        title={statusConfig[status].label}
                                    >
                                        <StatusIcon status={status} variant="dot" size={12} />
                                    </Button>
                                ))}
                            </div>

                            <CollapsibleTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7">
                                    {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                </Button>
                            </CollapsibleTrigger>

                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive hover:bg-destructive/10"
                                onClick={onRemoveGrupo}
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </CardHeader>

                <CollapsibleContent>
                    <CardContent className="p-4 pt-2">
                        <Textarea
                            value={grupo.observacoes}
                            onChange={(e) => onUpdateObservacoes(e.target.value)}
                            placeholder="Observações sobre este grupo..."
                            className="mb-4 text-sm min-h-[60px]"
                        />

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {conteudos.map((c) => (
                                <VideoCard
                                    key={c.id}
                                    conteudo={c}
                                    onRemove={() => onRemoveConteudo(c.id)}
                                    onUpdateNotas={(notas) => onUpdateConteudoNotas(c.id, notas)}
                                />
                            ))}

                            {/* Add Video Card */}
                            {showAddForm ? (
                                <Card className="border-primary border-dashed">
                                    <CardContent className="p-4 space-y-2">
                                        <Input
                                            placeholder="Título (opcional)"
                                            value={newVideoTitle}
                                            onChange={(e) => setNewVideoTitle(e.target.value)}
                                        />
                                        <Input
                                            placeholder="Cole a URL do vídeo"
                                            value={newVideoUrl}
                                            onChange={(e) => setNewVideoUrl(e.target.value)}
                                            autoFocus
                                            onKeyDown={(e) => e.key === 'Enter' && handleAddVideo()}
                                        />
                                        <div className="flex gap-2">
                                            <Button size="sm" onClick={handleAddVideo} disabled={!newVideoUrl.trim()}>
                                                Adicionar
                                            </Button>
                                            <Button size="sm" variant="ghost" onClick={() => setShowAddForm(false)}>
                                                Cancelar
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ) : (
                                <button
                                    onClick={() => setShowAddForm(true)}
                                    className="flex flex-col items-center justify-center min-h-[180px] border-2 border-dashed border-muted rounded-lg hover:border-primary hover:bg-primary/5 transition-all cursor-pointer"
                                >
                                    <Plus className="w-8 h-8 text-muted-foreground mb-2" />
                                    <span className="text-sm text-muted-foreground">Adicionar Vídeo</span>
                                </button>
                            )}
                        </div>
                    </CardContent>
                </CollapsibleContent>
            </Card>
        </Collapsible>
    );
}

function TecnicaContent() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const {
        isLoaded,
        getTecnica,
        getTecnicasComStatus,
        getVariacoes,
        getConteudos,
        addVariacao,
        updateVariacao,
        removeVariacao,
        updateTecnicaStatusManual,
        updateTecnicaObservacoes,
        addConteudo,
        removeConteudo,
        updateConteudo,
    } = useExamData();

    const [showAddGrupo, setShowAddGrupo] = useState(false);
    const [newGrupoName, setNewGrupoName] = useState('');

    const allTecnicas = useMemo(() => getTecnicasComStatus(), [getTecnicasComStatus]);

    const currentIndex = useMemo(() =>
        allTecnicas.findIndex(t => t.id === id), [allTecnicas, id]);
    const prevTecnica = currentIndex > 0 ? allTecnicas[currentIndex - 1] : null;
    const nextTecnica = currentIndex < allTecnicas.length - 1 ? allTecnicas[currentIndex + 1] : null;

    if (!isLoaded) {
        return <div className="flex items-center justify-center h-screen">Carregando...</div>;
    }

    const tecnica = getTecnica(id);

    if (!tecnica) {
        return (
            <div className="flex flex-col items-center justify-center h-screen gap-4">
                <p>Técnica não encontrada</p>
                <Button onClick={() => router.push('/')}>Voltar</Button>
            </div>
        );
    }

    const variacoes = getVariacoes(id);
    const isFundamentoTeorico = tecnica.qtdExigida === null;
    const config = statusConfig[tecnica.status];

    const getProgressoLabel = () => {
        if (isFundamentoTeorico) return null;
        const total = tecnica.qtdExigida === 'TODOS' ? (tecnica.totalVariacoes || '?') : (tecnica.qtdExigida || 0);
        return `(${tecnica.variacoesDominadas}/${total})`;
    };

    const handleAddGrupo = () => {
        if (newGrupoName.trim()) {
            addVariacao({
                tecnicaId: id,
                nome: newGrupoName.trim(),
                status: 'nao_sei',
                observacoes: '',
            });
            setNewGrupoName('');
            setShowAddGrupo(false);
        }
    };

    return (
        <div className="flex min-h-screen">
            {/* Área Principal */}
            <main className="flex-1 p-6 overflow-auto">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                    <Button variant="link" className="p-0 h-auto" onClick={() => router.push('/')}>
                        ← Dashboard
                    </Button>
                    <span>/</span>
                    <span className="text-primary">{tecnica.categoria}</span>
                </div>

                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold">{tecnica.nome}</h1>
                    <Badge className={`${config.color} text-white`}>
                        {config.label} {getProgressoLabel()}
                    </Badge>
                </div>

                {/* Biblioteca de Vídeos */}
                <Card className="mb-6">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-lg">📚 Biblioteca de Vídeos</CardTitle>
                        {!isFundamentoTeorico && (
                            showAddGrupo ? (
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Nome do grupo"
                                        value={newGrupoName}
                                        onChange={(e) => setNewGrupoName(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleAddGrupo();
                                            if (e.key === 'Escape') setShowAddGrupo(false);
                                        }}
                                        className="w-48"
                                        autoFocus
                                    />
                                    <Button size="sm" onClick={handleAddGrupo}>Criar</Button>
                                    <Button size="sm" variant="ghost" onClick={() => setShowAddGrupo(false)}>Cancelar</Button>
                                </div>
                            ) : (
                                <Button onClick={() => setShowAddGrupo(true)}>
                                    <Plus className="w-4 h-4 mr-2" /> Novo Grupo
                                </Button>
                            )
                        )}
                    </CardHeader>
                    <CardContent>
                        {variacoes.length > 0 ? (
                            <div className="space-y-4">
                                {variacoes.map((v) => {
                                    const vConteudos = getConteudos(undefined, v.id);
                                    return (
                                        <GrupoCard
                                            key={v.id}
                                            grupo={v}
                                            conteudos={vConteudos}
                                            onUpdateStatus={(status) => updateVariacao(v.id, { status })}
                                            onRemoveGrupo={() => removeVariacao(v.id)}
                                            onAddConteudo={(data) => addConteudo({ ...data, variacaoId: v.id, observacoes: '' })}
                                            onRemoveConteudo={removeConteudo}
                                            onUpdateConteudoNotas={(cId, notas) => updateConteudo(cId, { observacoes: notas })}
                                            onUpdateObservacoes={(obs) => updateVariacao(v.id, { observacoes: obs })}
                                        />
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <div className="text-4xl mb-4">📹</div>
                                <p className="text-muted-foreground mb-2">Nenhum grupo criado ainda.</p>
                                <p className="text-sm text-muted-foreground mb-4">Crie um grupo para organizar seus vídeos de estudo.</p>
                                {!isFundamentoTeorico && (
                                    <Button onClick={() => setShowAddGrupo(true)}>
                                        <Plus className="w-4 h-4 mr-2" /> Novo Grupo
                                    </Button>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Status Manual (Fundamentos) */}
                {isFundamentoTeorico && (
                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle className="text-lg">Status</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground mb-3">Marque seu nível de conhecimento:</p>
                            <div className="flex gap-2">
                                {(['nao_sei', 'aprendendo', 'dominada'] as Status[]).map((status) => (
                                    <Button
                                        key={status}
                                        variant={tecnica.status === status ? "default" : "outline"}
                                        className={tecnica.status === status ? statusConfig[status].color : ''}
                                        onClick={() => updateTecnicaStatusManual(id, status)}
                                    >
                                        {statusConfig[status].label}
                                    </Button>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Anotações */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="text-lg">📝 Anotações</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Textarea
                            value={tecnica.observacoes}
                            onChange={(e) => updateTecnicaObservacoes(id, e.target.value)}
                            placeholder="Suas anotações sobre esta técnica..."
                            className="min-h-[100px]"
                        />
                    </CardContent>
                </Card>

                {/* Navegação */}
                <div className="flex justify-between">
                    {prevTecnica ? (
                        <Button variant="outline" onClick={() => router.push(`/tecnica/${prevTecnica.id}`)}>
                            ← {prevTecnica.nome}
                        </Button>
                    ) : <div />}
                    {nextTecnica && (
                        <Button variant="outline" onClick={() => router.push(`/tecnica/${nextTecnica.id}`)}>
                            {nextTecnica.nome} →
                        </Button>
                    )}
                </div>
            </main>

            {/* Sidebar */}
            <CourseSidebar tecnicas={allTecnicas} currentTecnicaId={id} />
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
