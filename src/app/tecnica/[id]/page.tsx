'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useMemo, useEffect } from 'react';
import { useExamStore } from '@/store/exam-store';
import { AuthGuard } from '@/components/AuthGuard';
import { StatusIcon, ChevronIcon } from '@/components/StatusIcon';
import { ExamRequirement, LearningStatus, MediaItem, MediaFolder } from '@/types/exam';
import { EXAM_REQUIREMENTS } from '@/data/exam-requirements';

// Shadcn components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
    Plus,
    Trash2,
    ExternalLink,
    FileText,
    ChevronDown,
    ChevronUp,
    GripVertical,
    Play,
    Youtube,
    Folder
} from 'lucide-react';

const statusConfig = {
    todo: { label: 'A fazer', color: 'bg-red-500', textColor: 'text-red-500' },
    learning: { label: 'Aprendendo', color: 'bg-yellow-500', textColor: 'text-yellow-500' },
    done: { label: 'Dominada', color: 'bg-green-500', textColor: 'text-green-500' },
};

// Detectar plataforma
function detectPlatform(url: string): 'video' | 'link' {
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'video';
    if (url.includes('tiktok.com')) return 'video';
    if (url.includes('instagram.com')) return 'video';
    return 'link'; // Default to link for now, or 'video' if we want generic video support
}

// Thumbnail do YouTube
function getYouTubeThumbnail(url: string): string | null {
    const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&\s]+)/);
    return match ? `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg` : null;
}

// Componente MediaCard (antigo VideoCard)
function MediaCard({
    media,
    onRemove,
    onUpdateNotas
}: {
    media: MediaItem;
    onRemove: () => void;
    onUpdateNotas: (notas: string) => void;
}) {
    const [showNotas, setShowNotas] = useState(false);
    const [notasValue, setNotasValue] = useState(media.notes || '');
    const thumbnail = media.type === 'video' ? getYouTubeThumbnail(media.url) : null;

    const handleNotasBlur = () => {
        if (notasValue !== media.notes) {
            onUpdateNotas(notasValue);
        }
    };

    return (
        <Card className="group overflow-hidden bg-card hover:border-primary/50 transition-all">
            {/* Thumbnail */}
            <div
                className="relative aspect-video bg-muted cursor-pointer overflow-hidden"
                onClick={() => window.open(media.url, '_blank')}
            >
                {thumbnail ? (
                    <img src={thumbnail} alt={media.title || 'Vídeo'} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-secondary/20">
                        {media.type === 'video' ? (
                            <Play className="w-12 h-12 text-muted-foreground/50" />
                        ) : (
                            <ExternalLink className="w-12 h-12 text-muted-foreground/50" />
                        )}
                    </div>
                )}
                {media.type === 'video' && (
                    <Badge className="absolute top-2 left-2 bg-red-600 text-white shadow-sm">
                        <Youtube className="w-3 h-3 mr-1" />
                        Video
                    </Badge>
                )}
            </div>

            <CardContent className="p-3">
                <h4 className="font-medium text-sm truncate mb-2" title={media.title}>
                    {media.title || 'Mídia sem título'}
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
                        onClick={() => window.open(media.url, '_blank')}
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

// Componente FolderSection (antigo GrupoCard)
function FolderSection({
    folder,
    mediaItems,
    onRemoveFolder,
    onAddMedia,
    onRemoveMedia,
    onUpdateMediaNotas
}: {
    folder: MediaFolder;
    mediaItems: MediaItem[];
    onRemoveFolder: () => void;
    onAddMedia: (title: string, url: string, type: 'video' | 'link') => void;
    onRemoveMedia: (mediaId: string) => void;
    onUpdateMediaNotas: (mediaId: string, notes: string) => void;
}) {
    const [isOpen, setIsOpen] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newMediaUrl, setNewMediaUrl] = useState('');
    const [newMediaTitle, setNewMediaTitle] = useState('');

    const handleAdd = () => {
        if (!newMediaUrl.trim()) return;
        const type = detectPlatform(newMediaUrl);
        onAddMedia(
            newMediaTitle.trim() || 'Nova Mídia',
            newMediaUrl.trim(),
            type
        );
        setNewMediaUrl('');
        setNewMediaTitle('');
        setShowAddForm(false);
    };

    return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mb-4">
            <Card className="border-l-4 border-l-primary/50">
                <CardHeader className="p-4 pb-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Folder className="w-4 h-4 text-primary" />
                            <CardTitle className="text-base font-semibold">{folder.name}</CardTitle>
                            <Badge variant="secondary" className="text-xs">
                                {mediaItems.length} itens
                            </Badge>
                        </div>

                        <div className="flex items-center gap-2">
                            <CollapsibleTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7">
                                    {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                </Button>
                            </CollapsibleTrigger>

                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive hover:bg-destructive/10"
                                onClick={onRemoveFolder}
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </CardHeader>

                <CollapsibleContent>
                    <CardContent className="p-4 pt-2">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {mediaItems.map((m) => (
                                <MediaCard
                                    key={m.id}
                                    media={m}
                                    onRemove={() => onRemoveMedia(m.id)}
                                    onUpdateNotas={(notes) => onUpdateMediaNotas(m.id, notes)}
                                />
                            ))}

                            {/* Add Media Card */}
                            {showAddForm ? (
                                <Card className="border-primary border-dashed">
                                    <CardContent className="p-4 space-y-2">
                                        <Input
                                            placeholder="Título (opcional)"
                                            value={newMediaTitle}
                                            onChange={(e) => setNewMediaTitle(e.target.value)}
                                        />
                                        <Input
                                            placeholder="Cole a URL"
                                            value={newMediaUrl}
                                            onChange={(e) => setNewMediaUrl(e.target.value)}
                                            autoFocus
                                            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                                        />
                                        <div className="flex gap-2">
                                            <Button size="sm" onClick={handleAdd} disabled={!newMediaUrl.trim()}>
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
                                    <span className="text-sm text-muted-foreground">Adicionar Mídia</span>
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
    const idStr = params.id as string;
    const reqId = parseInt(idStr, 10);

    const {
        requirements,
        userState,
        updateStatus,
        updateNotes,
        addMedia,
        removeMedia,
        createFolder,
        removeFolder,
        updateMediaNotes,
        init,
        isLoading
    } = useExamStore();

    useEffect(() => {
        init();
    }, []);

    const requirement = requirements.find(r => r.id === reqId);
    // Ensure state exists safely
    const state = userState[reqId] || { reqId: reqId, status: 'todo' as LearningStatus, notes: '', media: [], folders: [] };

    const [showAddFolder, setShowAddFolder] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [showAddLooseMedia, setShowAddLooseMedia] = useState(false);
    const [newLooseMediaUrl, setNewLooseMediaUrl] = useState('');
    const [newLooseMediaTitle, setNewLooseMediaTitle] = useState('');

    if (isNaN(reqId)) {
        return <div className="p-8 text-center">ID inválido</div>;
    }

    if (!requirement) {
        return (
            <div className="flex flex-col items-center justify-center h-screen gap-4">
                <p>Requisito não encontrado</p>
                <Button onClick={() => router.push('/')}>Voltar ao Dashboard</Button>
            </div>
        );
    }

    const config = statusConfig[state.status || 'todo'];

    const handleCreateFolder = () => {
        if (newFolderName.trim()) {
            createFolder(reqId, newFolderName.trim());
            setNewFolderName('');
            setShowAddFolder(false);
        }
    };

    const handleAddLooseMedia = () => {
        if (newLooseMediaUrl.trim()) {
            const type = detectPlatform(newLooseMediaUrl);
            addMedia(reqId, type, newLooseMediaTitle.trim() || 'Nova Mídia', newLooseMediaUrl.trim());
            setNewLooseMediaUrl('');
            setNewLooseMediaTitle('');
            setShowAddLooseMedia(false);
        }
    };

    // Organize media
    const looseMedia = state.media?.filter(m => !m.folderId) || [];

    return (
        <div className="flex min-h-screen bg-background">
            <main className="flex-1 p-6 overflow-auto max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <Button variant="link" className="p-0 h-auto text-muted-foreground mb-2" onClick={() => router.push('/')}>
                        ← Voltar para Dashboard
                    </Button>

                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <Badge variant="outline" className="mb-2">{requirement.category}</Badge>
                            <h1 className="text-2xl font-bold">{requirement.name}</h1>
                        </div>

                        <div className="flex gap-2">
                            {(['todo', 'learning', 'done'] as LearningStatus[]).map((s) => (
                                <Button
                                    key={s}
                                    variant={state.status === s ? "default" : "outline"}
                                    className={state.status === s ? statusConfig[s].color : ''}
                                    onClick={() => updateStatus(reqId, s)}
                                >
                                    {statusConfig[s].label}
                                </Button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="space-y-6">

                    {/* Folders & Media Library */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-lg flex items-center gap-2">
                                📚 Biblioteca de Estudo
                            </CardTitle>
                            <div className="flex gap-2">
                                <Button size="sm" variant="outline" onClick={() => setShowAddLooseMedia(true)}>
                                    <Plus className="w-4 h-4 mr-2" /> Mídia Solta
                                </Button>
                                {showAddFolder ? (
                                    <div className="flex gap-2 items-center bg-muted p-1 rounded-md">
                                        <Input
                                            className="h-8 w-40"
                                            placeholder="Nome da pasta"
                                            value={newFolderName}
                                            onChange={(e) => setNewFolderName(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
                                            autoFocus
                                        />
                                        <Button size="sm" className="h-8" onClick={handleCreateFolder}>Ok</Button>
                                        <Button size="sm" variant="ghost" className="h-8 px-2" onClick={() => setShowAddFolder(false)}>X</Button>
                                    </div>
                                ) : (
                                    <Button size="sm" onClick={() => setShowAddFolder(true)}>
                                        <Plus className="w-4 h-4 mr-2" /> Nova Pasta
                                    </Button>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>

                            {/* Render Folders */}
                            {state.folders?.map(folder => (
                                <FolderSection
                                    key={folder.id}
                                    folder={folder}
                                    mediaItems={state.media?.filter(m => m.folderId === folder.id) || []}
                                    onRemoveFolder={() => removeFolder(reqId, folder.id)}
                                    onAddMedia={(title, url, type) => addMedia(reqId, type, title, url, folder.id)}
                                    onRemoveMedia={(mediaId) => removeMedia(reqId, mediaId)}
                                    onUpdateMediaNotas={(mediaId, notes) => updateMediaNotes(reqId, mediaId, notes)}
                                />
                            ))}

                            {/* Render Loose Media (if any or if adding) */}
                            {(looseMedia.length > 0 || showAddLooseMedia) && (
                                <div className="mt-6">
                                    <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Mídias Diversas</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {looseMedia.map(m => (
                                            <MediaCard
                                                key={m.id}
                                                media={m}
                                                onRemove={() => removeMedia(reqId, m.id)}
                                                onUpdateNotas={(notes) => updateMediaNotes(reqId, m.id, notes)}
                                            />
                                        ))}

                                        {showAddLooseMedia && (
                                            <Card className="border-primary border-dashed">
                                                <CardContent className="p-4 space-y-2">
                                                    <Input
                                                        placeholder="Título (opcional)"
                                                        value={newLooseMediaTitle}
                                                        onChange={(e) => setNewLooseMediaTitle(e.target.value)}
                                                    />
                                                    <Input
                                                        placeholder="URL do vídeo/link"
                                                        value={newLooseMediaUrl}
                                                        onChange={(e) => setNewLooseMediaUrl(e.target.value)}
                                                        autoFocus
                                                        onKeyDown={(e) => e.key === 'Enter' && handleAddLooseMedia()}
                                                    />
                                                    <div className="flex gap-2">
                                                        <Button size="sm" onClick={handleAddLooseMedia} disabled={!newLooseMediaUrl.trim()}>
                                                            Adicionar
                                                        </Button>
                                                        <Button size="sm" variant="ghost" onClick={() => setShowAddLooseMedia(false)}>
                                                            Cancelar
                                                        </Button>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        )}
                                    </div>
                                </div>
                            )}

                            {state.folders?.length === 0 && looseMedia.length === 0 && !showAddLooseMedia && (
                                <div className="text-center py-12 text-muted-foreground">
                                    <p>Nenhuma mídia adicionada ainda.</p>
                                    <p className="text-sm">Crie pastas ou adicione vídeos para começar a estudar.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Notes Area */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">📝 Anotações Gerais</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Textarea
                                value={state.notes || ''}
                                onChange={(e) => updateNotes(reqId, e.target.value)}
                                placeholder="Suas observações e anotações sobre este requisito..."
                                className="min-h-[150px]"
                            />
                        </CardContent>
                    </Card>

                </div>
            </main>
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
