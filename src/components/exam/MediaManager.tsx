'use client';

import { useState, useEffect, useRef } from 'react';
import { useExamStore } from '@/store/exam-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FolderPlus, Link as LinkIcon, Trash2, Folder, Video, ChevronRight, ChevronLeft, ChevronDown, LayoutList, LayoutGrid, X, MessageSquare, Info, Play, ListVideo, Youtube, NotebookPen, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogClose
} from "@/components/ui/dialog"
import { ScrollArea } from '@/components/ui/scroll-area';
import { MediaItem } from '@/types/exam';
import { RequirementsList } from './RequirementsList';

interface MediaManagerProps {
    reqId: number;
}

export function MediaManager({ reqId }: MediaManagerProps) {
    const userState = useExamStore(s => s.userState[reqId]);
    const addMedia = useExamStore(s => s.addMedia);
    const removeMedia = useExamStore(s => s.removeMedia);
    const createFolder = useExamStore(s => s.createFolder);
    const removeFolder = useExamStore(s => s.removeFolder);
    const updateNotes = useExamStore(s => s.updateNotes);
    const updateMediaNotes = useExamStore(s => s.updateMediaNotes);

    // Get Requirement Info
    const requirement = useExamStore(s => s.requirements.find(r => r.id === reqId));

    const [isAddLinkOpen, setIsAddLinkOpen] = useState(false);
    const [isAddFolderOpen, setIsAddFolderOpen] = useState(false);
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
    const [showRequirementList, setShowRequirementList] = useState(false);

    // Add Link Form
    const [linkTitle, setLinkTitle] = useState('');
    const [linkUrl, setLinkUrl] = useState('');
    const [targetFolderId, setTargetFolderId] = useState<string | undefined>(undefined);

    // Add Folder Form
    const [folderName, setFolderName] = useState('');

    const [activeMedia, setActiveMedia] = useState<MediaItem | null>(null);

    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

    // Notes state (General)
    const [generalNotes, setGeneralNotes] = useState(userState?.notes || '');

    // Media Notes State (Specific to active video)
    const [mediaNotes, setMediaNotes] = useState('');

    const activeItemRef = useRef<HTMLButtonElement>(null);

    // Close player OR switch to first video when switching requirements
    useEffect(() => {
        setShowRequirementList(false);

        // Only switch/persist player if it is ALREADY OPEN.
        // If it's closed (activeMedia === null), do NOT open it automatically.
        if (!activeMedia) return;

        // Auto-play first video of the new requirement if available
        if (allPlayableMedia.length > 0) {
            setActiveMedia(allPlayableMedia[0]);
        } else {
            // Keep player open with placeholder if no media exists
            setActiveMedia({
                id: 'EMPTY_PLACEHOLDER',
                type: 'video',
                title: requirement?.name || 'Sem Título',
                url: '',
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [reqId]); // Depend only on reqId to trigger on navigation

    useEffect(() => {
        setGeneralNotes(userState?.notes || '');
    }, [userState?.notes]);

    // Sync media notes when active media changes
    useEffect(() => {
        if (activeMedia) {
            // Find current media object to get latest notes
            const currentMediaItem = userState?.media.find(m => m.id === activeMedia.id);
            setMediaNotes(currentMediaItem?.notes || '');
        }
    }, [activeMedia, userState?.media]);

    const handleGeneralNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value;
        setGeneralNotes(newValue);
        updateNotes(reqId, newValue);
    };

    const handleMediaNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value;
        setMediaNotes(newValue);
        if (activeMedia) {
            updateMediaNotes(reqId, activeMedia.id, newValue);
        }
    };

    const toggleFolder = (id: string) => {
        const newSet = new Set(expandedFolders);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setExpandedFolders(newSet);
    };

    const handleAddLink = async () => {
        if (linkTitle) {
            let finalFolderId = targetFolderId;

            if (targetFolderId === 'NEW_FOLDER') {
                if (!folderName.trim()) return;
                const newId = await createFolder(reqId, folderName);
                if (newId) {
                    finalFolderId = newId;
                } else {
                    return; // Stop if creation failed
                }
            }

            addMedia(reqId, 'video', linkTitle, linkUrl || '#', finalFolderId);
            setLinkTitle('');
            setLinkUrl('');
            setTargetFolderId(undefined);
            setFolderName('');
            setIsAddLinkOpen(false);
        }
    };

    const handleCreateFolder = () => {
        if (folderName) {
            createFolder(reqId, folderName);
            setFolderName('');
            setIsAddFolderOpen(false);
        }
    };

    const folders = userState?.folders || [];
    const media = userState?.media || [];
    const rootMedia = media.filter(m => !m.folderId);

    const getYoutubeId = (url: string) => {
        if (!url) return null;
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    const getTikTokId = (url: string) => {
        if (!url) return null;
        const regExp = /\/video\/(\d+)/;
        const match = url.match(regExp);
        return match ? match[1] : null;
    };

    const getPlatformInfo = (url: string) => {
        const yId = getYoutubeId(url);
        const tId = getTikTokId(url);
        if (yId) return { type: 'youtube', label: 'YouTube', icon: Youtube, color: 'text-red-500' };
        if (tId) return { type: 'tiktok', label: 'TikTok', icon: Video, color: 'text-cyan-400' };
        return { type: 'link', label: 'Link', icon: LinkIcon, color: 'text-slate-400' };
    };

    // Flatten all media for navigation (Folders first, then root)
    const allPlayableMedia = [
        ...folders.flatMap(f => media.filter(m => m.folderId === f.id).map(m => ({ ...m, folderName: f.name }))),
        ...rootMedia.map(m => ({ ...m, folderName: 'Raiz' }))
    ].filter(m => getYoutubeId(m.url) || getTikTokId(m.url));

    const handleNext = () => {
        if (!activeMedia) return;
        const idx = allPlayableMedia.findIndex(m => m.id === activeMedia.id);
        if (idx !== -1 && idx < allPlayableMedia.length - 1) {
            setActiveMedia(allPlayableMedia[idx + 1]);
        }
    };

    const handlePrev = () => {
        if (!activeMedia) return;
        const idx = allPlayableMedia.findIndex(m => m.id === activeMedia.id);
        if (idx !== -1 && idx > 0) {
            setActiveMedia(allPlayableMedia[idx - 1]);
        }
    };

    // Keyboard Navigation & Scroll to Active Item
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!activeMedia) return;
            // Ignore if typing in textarea
            if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) return;

            if (e.key === 'ArrowRight') handleNext();
            if (e.key === 'ArrowLeft') handlePrev();
        };
        window.addEventListener('keydown', handleKeyDown);

        // Scroll active item into view
        if (activeMedia && activeItemRef.current) {
            activeItemRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }

        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [activeMedia]);

    const renderPlayerModal = () => {
        if (!activeMedia) return null;

        const isPlaceholder = activeMedia.id === 'EMPTY_PLACEHOLDER';
        const youtubeId = !isPlaceholder ? getYoutubeId(activeMedia.url) : null;
        const tiktokId = !isPlaceholder ? getTikTokId(activeMedia.url) : null;

        const currentIndex = allPlayableMedia.findIndex(m => m.id === activeMedia.id);
        const totalCount = allPlayableMedia.length;
        const currentItem = allPlayableMedia[currentIndex];

        // @ts-ignore - folderName added during flattening
        const folderName = currentItem?.folderName || (isPlaceholder ? 'Geral' : '...');

        return (
            <Dialog open={!!activeMedia} onOpenChange={(open) => !open && setActiveMedia(null)}>
                <DialogContent className="max-w-[100vw] h-[100vh] p-0 bg-transparent border-0 shadow-none flex focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 gap-0">

                    {/* Left Side: Video Player with Blurred Backdrop */}
                    <div
                        className="flex-1 relative flex items-center justify-center bg-black/30 backdrop-blur-sm h-full overflow-hidden group cursor-pointer"
                        onClick={() => setActiveMedia(null)}
                    >

                        {/* Player Container */}
                        <div
                            className="relative w-full h-full flex items-center justify-center p-4 cursor-default"
                        >
                            {/* YouTube: Responsive Max Size */}
                            {youtubeId && (
                                <div className="w-full h-full flex items-center justify-center">
                                    <div className="aspect-video w-full max-h-full max-w-[120vh] shadow-2xl bg-black rounded-lg overflow-hidden ring-1 ring-white/10" onClick={(e) => e.stopPropagation()}>
                                        <iframe
                                            src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1`}
                                            className="w-full h-full"
                                            allowFullScreen
                                            allow="autoplay"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* TikTok: Vertical Player */}
                            {tiktokId && (
                                <div className="h-full flex items-center justify-center py-4">
                                    <div className="aspect-[9/16] h-full max-h-full rounded-md overflow-hidden bg-black border border-white/10 shadow-2xl ring-1 ring-white/10" onClick={(e) => e.stopPropagation()}>
                                        <iframe
                                            src={`https://www.tiktok.com/player/v1/${tiktokId}?music_info=0&description=0&headers=0&autoplay=1`}
                                            className="w-full h-full"
                                            allowFullScreen
                                            allow="autoplay"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Placeholder: No Content */}
                            {isPlaceholder && (
                                <div className="bg-white p-8 rounded-xl shadow-2xl text-center max-w-md flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
                                    <Video size={48} className="mx-auto mb-4 text-slate-300" />
                                    <p className="text-slate-800 font-medium mb-2">Nenhum vídeo disponível</p>
                                    <p className="text-sm text-slate-500 mb-6">Esta técnica ainda não possui conteúdo multimídia.</p>

                                    <Button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setActiveMedia(null);
                                            setIsAddLinkOpen(true);
                                        }}
                                        variant="outline"
                                        className="gap-2 border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-blue-600"
                                    >
                                        <Plus size={16} />
                                        Adicionar Link
                                    </Button>
                                </div>
                            )}

                            {/* Fallback Display (Link) */}
                            {!youtubeId && !tiktokId && !isPlaceholder && (
                                <div className="bg-white p-8 rounded-xl shadow-2xl text-center max-w-md" onClick={(e) => e.stopPropagation()}>
                                    <p className="text-slate-800 font-medium mb-4">Este conteúdo não pode ser exibido no player imersivo.</p>
                                    <a href={activeMedia.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-semibold">
                                        Abrir link original ↗
                                    </a>
                                </div>
                            )}
                        </div>

                        {/* Overlay Controls (Close) */}
                        <DialogClose asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute top-4 left-4 text-white/70 hover:text-white hover:bg-white/10 rounded-full h-10 w-10 z-50 backdrop-blur-md bg-black/20"
                            >
                                <X size={24} />
                            </Button>
                        </DialogClose>

                    </div>

                    {/* Right Side: Sidebar (Light Mode) */}
                    <div className="w-[360px] md:w-[400px] bg-white border-l border-slate-200 flex flex-col h-full shrink-0 text-slate-900 shadow-2xl z-50 relative">

                        {showRequirementList ? (
                            <div className="flex-1 h-full flex flex-col relative animate-in slide-in-from-right-4 duration-300">
                                {/* Back to Player Header */}
                                <div className="p-2 border-b flex items-center gap-2 bg-slate-50 text-slate-600">
                                    <Button variant="ghost" size="sm" onClick={() => setShowRequirementList(false)} className="gap-1 text-xs hover:bg-white">
                                        <ChevronLeft size={14} />
                                        Voltar ao Player
                                    </Button>
                                    <span className="text-xs font-semibold ml-auto opacity-50">Navegação</span>
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <RequirementsList />
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* Sidebar Header */}
                                <div className="p-4 border-b border-slate-100 flex flex-col gap-1 bg-white z-10">
                                    <div
                                        className="flex items-center gap-1.5 text-xs text-slate-500 uppercase tracking-widest font-semibold mb-1 cursor-pointer hover:text-blue-600 hover:underline transition-colors w-fit"
                                        onClick={() => setShowRequirementList(true)}
                                        title="Clique para ver a lista de técnicas"
                                    >
                                        <Video size={12} />
                                        <span className='line-clamp-1'>Player • {requirement?.name}</span>
                                        <ChevronRight size={12} className="opacity-50" />
                                    </div>
                                    <h2 className="text-xl font-bold text-slate-900 leading-tight line-clamp-2">{activeMedia.title}</h2>
                                    <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                                        {!isPlaceholder && (
                                            <>
                                                <span className={youtubeId ? 'text-red-500 font-medium' : tiktokId ? 'text-cyan-400 font-medium' : 'text-slate-500'}>
                                                    {youtubeId ? 'YouTube' : tiktokId ? 'TikTok' : 'Link'}
                                                </span>
                                                <span>•</span>
                                            </>
                                        )}
                                        <span>{folderName}</span>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto">
                                    {/* Notes Section - SPLIT (General & Video) */}
                                    <div className="bg-slate-50/50">
                                        {/* Video Specific Notes */}
                                        <div className="p-4 border-b border-slate-100">
                                            <div className={`flex items-center gap-2 mb-2 shrink-0 ${isPlaceholder ? 'text-slate-400' : 'text-slate-700'}`}>
                                                <NotebookPen size={16} className={isPlaceholder ? 'text-slate-400' : 'text-blue-600'} />
                                                <span className="text-sm font-semibold">Anotações do Vídeo</span>
                                            </div>
                                            <Textarea
                                                value={!isPlaceholder ? mediaNotes : ''}
                                                onChange={handleMediaNotesChange}
                                                disabled={isPlaceholder}
                                                placeholder={isPlaceholder ? "Não há vídeo para adicionar anotações." : `Anotações sobre "${activeMedia.title}"...`}
                                                className="w-full h-24 min-h-[80px] bg-white border-slate-200 text-slate-900 text-sm placeholder:text-slate-400 resize-none focus:ring-1 focus:ring-blue-500 p-3 leading-relaxed rounded-lg shadow-sm disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                                            />
                                        </div>

                                        {/* General Technique Notes */}
                                        <div className="p-4 border-b border-slate-100 bg-white">
                                            <div className="flex items-center gap-2 mb-2 text-slate-600 shrink-0">
                                                <MessageSquare size={16} />
                                                <span className="text-sm font-medium">Anotações da Técnica (Geral)</span>
                                            </div>
                                            <Textarea
                                                value={generalNotes}
                                                onChange={handleGeneralNotesChange}
                                                placeholder="Anotações gerais sobre esta técnica..."
                                                className="w-full h-20 min-h-[60px] bg-slate-50 border-slate-200 text-slate-900 text-sm placeholder:text-slate-400 resize-none focus:ring-1 focus:ring-blue-500 p-2 leading-relaxed rounded-lg shadow-sm"
                                            />
                                        </div>
                                    </div>

                                    {/* Playlist Header */}
                                    <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
                                        <div className="flex items-center gap-2 text-slate-700">
                                            <ListVideo size={16} />
                                            <span className="font-semibold text-sm">Na Fila</span>
                                        </div>
                                        <span className="text-xs text-slate-400 font-mono">{currentIndex + 1} / {totalCount}</span>
                                    </div>

                                    {/* Playlist Items */}
                                    <div className="flex flex-col pb-4">
                                        {allPlayableMedia.map((media, index) => {
                                            const isActive = media.id === activeMedia.id;
                                            const yId = getYoutubeId(media.url);
                                            const tId = getTikTokId(media.url);

                                            return (
                                                <button
                                                    key={media.id}
                                                    ref={isActive ? activeItemRef : null}
                                                    onClick={() => setActiveMedia(media)}
                                                    className={`flex items-start gap-3 p-3 text-left transition-colors border-b border-slate-100 ${isActive ? 'bg-blue-50 hover:bg-blue-50/80' : 'hover:bg-slate-100'}`}
                                                >
                                                    {/* Thumbnail */}
                                                    <div className="relative w-24 aspect-video rounded-md overflow-hidden bg-slate-200 shrink-0 ring-1 ring-black/5 shadow-sm">
                                                        {yId ? (
                                                            <img src={`https://img.youtube.com/vi/${yId}/mqdefault.jpg`} className="w-full h-full object-cover opacity-90 group-hover:opacity-100" />
                                                        ) : tId ? (
                                                            <div className="w-full h-full flex items-center justify-center bg-black"><span className="text-[10px] font-bold text-white">TikTok</span></div>
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center"><LinkIcon size={16} className="text-slate-400" /></div>
                                                        )}

                                                        {/* Playing Indicator */}
                                                        {isActive && (
                                                            <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center backdrop-blur-[1px]">
                                                                <Play size={16} className="text-white fill-current drop-shadow-md" />
                                                            </div>
                                                        )}

                                                        <div className="absolute bottom-0.5 right-1 text-[9px] font-mono text-white/90 bg-black/60 px-1 rounded shadow-sm">
                                                            {index + 1}
                                                        </div>
                                                    </div>

                                                    {/* Text Info */}
                                                    <div className="flex-1 min-w-0 pt-0.5">
                                                        <h4 className={`text-sm font-medium leading-tight mb-1 line-clamp-2 ${isActive ? 'text-blue-700' : 'text-slate-700 group-hover:text-slate-900'}`}>
                                                            {media.title}
                                                        </h4>
                                                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                                                            <Folder size={10} />
                                                            <span className="truncate max-w-[120px]">{media.folderName}</span>
                                                        </div>
                                                    </div>
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>

                                {/* Sidebar Footer Area */}
                                <div className="p-4 bg-white border-t border-slate-100 shrink-0 shadow-[0_-10px_40px_-10px_rgba(0,0,0,0.05)] z-20">
                                    {/* Navigation Buttons */}
                                    <div className="flex items-center justify-between gap-2">
                                        <Button
                                            variant="outline"
                                            disabled={currentIndex === 0}
                                            onClick={handlePrev}
                                            className="flex-1 bg-white border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-30 h-10 shadow-sm"
                                        >
                                            <ChevronRight className="rotate-180 mr-2" size={16} />
                                            Anterior
                                        </Button>
                                        <Button
                                            variant="default"
                                            disabled={currentIndex === totalCount - 1}
                                            onClick={handleNext}
                                            className="flex-1 bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 h-10 shadow-md"
                                        >
                                            Próxima
                                            <ChevronRight className="ml-2" size={16} />
                                        </Button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                </DialogContent>
            </Dialog>
        );
    };

    const renderThumbnail = (item: MediaItem) => {
        const youtubeId = getYoutubeId(item.url);
        const tiktokId = getTikTokId(item.url);
        const platform = getPlatformInfo(item.url);
        const PlatformIcon = platform.icon;

        const isVideo = youtubeId || tiktokId;

        return (
            <div
                className={`relative group cursor-pointer overflow-hidden rounded-md border bg-slate-100 ${viewMode === 'list' ? 'w-[120px] aspect-video flex-shrink-0' : 'w-full aspect-video'}`}
                onClick={(e) => {
                    if (isVideo) {
                        e.preventDefault();
                        setActiveMedia(item);
                    }
                }}
            >
                {youtubeId ? (
                    <img
                        src={`https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`}
                        alt={item.title}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                ) : tiktokId ? (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-black text-white">
                        <span className="font-bold text-xs"><span className="text-cyan-400">Tik</span><span className="text-rose-500">Tok</span></span>
                    </div>
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                        <LinkIcon size={24} />
                    </div>
                )}

                {isVideo && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
                        <div className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow-sm transform scale-90 group-hover:scale-110 transition-transform">
                            <Video size={16} className="text-blue-600 fill-current" />
                        </div>
                    </div>
                )}

                {/* Platform Tag (New) */}
                <div className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-sm flex items-center gap-1 opacity-90">
                    <PlatformIcon size={10} className={platform.color} />
                    <span className="text-[9px] font-bold text-white uppercase tracking-wider">{platform.label}</span>
                </div>
            </div>
        );
    };

    return (
        <div className="h-full flex flex-col relative">
            <div className="flex justify-between items-center mb-4">
                <div className="flex gap-2">
                    <Dialog open={isAddLinkOpen} onOpenChange={(open) => {
                        setIsAddLinkOpen(open);
                        if (!open) {
                            setLinkTitle('');
                            setLinkUrl('');
                            setTargetFolderId(undefined);
                            setFolderName('');
                        }
                    }}>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-2">
                                <LinkIcon size={16} /> Link
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Conteúdo</DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <Input placeholder="Título" value={linkTitle} onChange={e => setLinkTitle(e.target.value)} />
                                <Input placeholder="URL (YouTube)" value={linkUrl} onChange={e => setLinkUrl(e.target.value)} />

                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    value={targetFolderId || ''}
                                    onChange={e => setTargetFolderId(e.target.value || undefined)}
                                >
                                    <option value="">Sem pasta (Raiz)</option>
                                    {folders.map(f => (
                                        <option key={f.id} value={f.id}>{f.name}</option>
                                    ))}
                                    <option value="NEW_FOLDER">✨ Criar nova pasta...</option>
                                </select>

                                {targetFolderId === 'NEW_FOLDER' && (
                                    <Input
                                        placeholder="Nome da nova pasta"
                                        value={folderName}
                                        onChange={e => setFolderName(e.target.value)}
                                        autoFocus
                                    />
                                )}
                            </div>
                            <DialogFooter>
                                <Button onClick={handleAddLink}>Salvar</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <Dialog open={isAddFolderOpen} onOpenChange={setIsAddFolderOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-2">
                                <FolderPlus size={16} /> Pasta
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Nova Pasta</DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <Input placeholder="Nome" value={folderName} onChange={e => setFolderName(e.target.value)} />
                            </div>
                            <DialogFooter>
                                <Button onClick={handleCreateFolder}>Criar</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* View Toggle */}
                <div className="flex bg-slate-100 p-0.5 rounded-lg">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                        title="Grade"
                    >
                        <LayoutGrid size={16} />
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                        title="Lista"
                    >
                        <LayoutList size={16} />
                    </button>
                </div>
            </div>

            {renderPlayerModal()}

            <div className="overflow-y-auto pr-2 pb-10 flex-1">
                <div className={viewMode === 'grid' ? 'grid grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}>
                    {folders.map(folder => {
                        const folderMedia = media.filter(m => m.folderId === folder.id);
                        const isExpanded = expandedFolders.has(folder.id);
                        return (
                            <div key={folder.id} className={`border rounded-md bg-white ${viewMode === 'grid' ? 'col-span-full' : ''}`}>
                                <div className="flex items-center gap-2 p-2 bg-slate-50 border-b cursor-pointer" onClick={() => toggleFolder(folder.id)}>
                                    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                    <Folder size={16} className="text-blue-500" />
                                    <span className="font-medium text-sm flex-1">{folder.name}</span>
                                    <Badge variant="secondary" className="text-xs font-normal">{folderMedia.length}</Badge>
                                    <Button size="icon" variant="ghost" className="h-6 w-6 text-red-400 hover:text-red-500" onClick={(e) => {
                                        e.stopPropagation();
                                        removeFolder(reqId, folder.id);
                                    }}>
                                        <Trash2 size={14} />
                                    </Button>
                                </div>

                                {isExpanded && (
                                    <div className={`p-2 ${viewMode === 'grid' ? 'grid grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-2'}`}>
                                        {folderMedia.length === 0 && <p className="text-xs text-slate-400 italic pl-6 col-span-full">Vazia</p>}
                                        {folderMedia.map(item => (
                                            <div key={item.id} className={`${viewMode === 'list' ? 'flex items-start gap-3 p-2 hover:bg-slate-50 rounded-md transition-colors' : 'flex flex-col gap-2 border rounded-md p-2 hover:border-blue-300 transition-colors'} group relative`}>

                                                {renderThumbnail(item)}

                                                <div className="flex-1 min-w-0 flex flex-col justify-center">
                                                    <a
                                                        href={item.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-sm font-medium text-slate-900 hover:text-blue-600 line-clamp-2"
                                                        title={item.title}
                                                        onClick={(e) => {
                                                            if (getYoutubeId(item.url) || getTikTokId(item.url)) {
                                                                e.preventDefault();
                                                                setActiveMedia(item);
                                                            }
                                                        }}
                                                    >
                                                        {item.title}
                                                    </a>
                                                    {viewMode === 'list' && (
                                                        <span className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                                                            {getYoutubeId(item.url) ? 'YouTube' : getTikTokId(item.url) ? 'TikTok' : 'Link Externo'}
                                                        </span>
                                                    )}
                                                </div>

                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className={`h-6 w-6 text-slate-400 hover:text-red-500 ${viewMode === 'grid' ? 'absolute top-1 right-1 bg-white/80 hover:bg-white m-1' : 'opacity-0 group-hover:opacity-100'}`}
                                                    onClick={() => removeMedia(reqId, item.id)}
                                                >
                                                    <Trash2 size={14} />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {/* Root Media */}
                    {rootMedia.map(item => (
                        <div key={item.id} className={`${viewMode === 'list' ? 'flex items-start gap-3 p-2 border rounded-md bg-white hover:border-blue-300 transition-colors' : 'flex flex-col gap-2 border rounded-md p-2 bg-white hover:border-blue-300 transition-colors'} group relative`}>

                            {renderThumbnail(item)}

                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                                <a
                                    href={item.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm font-semibold text-slate-900 hover:text-blue-600 line-clamp-2"
                                    title={item.title}
                                    onClick={(e) => {
                                        if (getYoutubeId(item.url) || getTikTokId(item.url)) {
                                            e.preventDefault();
                                            setActiveMedia(item);
                                        }
                                    }}
                                >
                                    {item.title}
                                </a>
                                {viewMode === 'list' && (
                                    <span className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                                        {getYoutubeId(item.url) ? 'YouTube' : getTikTokId(item.url) ? 'TikTok' : 'Link Externo'}
                                    </span>
                                )}
                            </div>

                            <Button
                                size="icon"
                                variant="ghost"
                                className={`h-8 w-8 text-slate-400 hover:text-red-500 ${viewMode === 'grid' ? 'absolute top-2 right-2 bg-white/80 hover:bg-white m-1' : 'opacity-0 group-hover:opacity-100'}`}
                                onClick={() => removeMedia(reqId, item.id)}
                            >
                                <Trash2 size={16} />
                            </Button>
                        </div>
                    ))}
                </div>

                {media.length === 0 && folders.length === 0 && (
                    <div className="text-center py-12 text-slate-400 border-2 border-dashed rounded-lg">
                        <Video size={48} className="mx-auto mb-2 opacity-20" />
                        <p>Nenhum conteúdo</p>
                    </div>
                )}
            </div>
        </div>
    );
}
