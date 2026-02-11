'use client';

import { useState, useEffect, useRef } from 'react';
import { useExamStore } from '@/store/exam-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FolderPlus, Link as LinkIcon, Trash2, Folder, Video, ChevronRight, ChevronLeft, ChevronDown, LayoutList, LayoutGrid, X, MessageSquare, Info, Play, ListVideo, Youtube, NotebookPen, Plus, Pencil, GripVertical } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    rectSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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
    const updateMediaChapters = useExamStore(s => s.updateMediaChapters);
    const updateMedia = useExamStore(s => s.updateMedia);
    const reorderMedia = useExamStore(s => s.reorderMedia);

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
    const [linkNotes, setLinkNotes] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');

    // Editing State
    const [editingMedia, setEditingMedia] = useState<MediaItem | null>(null);

    // Add Folder Form
    const [folderName, setFolderName] = useState('');

    const [activeMedia, setActiveMedia] = useState<MediaItem | null>(null);
    const [playerSeekTime, setPlayerSeekTime] = useState<number | null>(null);
    const [sidebarTab, setSidebarTab] = useState<'playlist' | 'chapters'>('playlist');
    const [newChapterTitle, setNewChapterTitle] = useState('');
    const [newChapterTime, setNewChapterTime] = useState('');

    // Editing State for Chapters
    const [editingChapterIndex, setEditingChapterIndex] = useState<number | null>(null);
    const [editingChapterTitle, setEditingChapterTitle] = useState('');
    const [editingChapterTime, setEditingChapterTime] = useState('');

    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

    // Notes state (General)
    const [generalNotes, setGeneralNotes] = useState(userState?.notes || '');

    // Media Notes State (Specific to active video)
    const [mediaNotes, setMediaNotes] = useState('');
    const [mediaChapters, setMediaChapters] = useState('');

    const activeItemRef = useRef<HTMLButtonElement>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 8 },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

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
                displayOrder: 0
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
            setMediaChapters(currentMediaItem?.chapters || '');
            setPlayerSeekTime(null); // Reset seek time on video change
            setEditingChapterIndex(null); // Reset editing state
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

    const parseTimeToSeconds = (timeStr: string): number => {
        if (!timeStr) return 0;
        if (/^\d+$/.test(timeStr)) return parseInt(timeStr);

        const parts = timeStr.split(':').reverse();
        let seconds = 0;
        if (parts[0]) seconds += parseInt(parts[0]); // seconds
        if (parts[1]) seconds += parseInt(parts[1]) * 60; // minutes
        if (parts[2]) seconds += parseInt(parts[2]) * 3600; // hours
        return seconds || 0;
    };

    const formatSecondsToTime = (seconds: number): string => {
        if (!seconds) return '';
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;

        if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const parseChapters = (text: string) => {
        if (!text) return [];
        // Match 01:20 or 1:20:30 followed by title
        const regex = /(?:(\d{1,2}):)?(\d{1,2}):(\d{2})\s*[-–—]?\s*(.*)/g;
        const chapters = [];
        let match;
        while ((match = regex.exec(text)) !== null) {
            const h = match[1] ? parseInt(match[1]) : 0;
            const m = parseInt(match[2]);
            const s = parseInt(match[3]);
            const title = match[4].trim();
            const time = h * 3600 + m * 60 + s;
            chapters.push({ time, title });
        }
        return chapters.sort((a, b) => a.time - b.time);
    };

    const handleAddLink = async () => {
        if (linkTitle) {
            let finalFolderId = targetFolderId;
            let finalUrl = linkUrl;

            // Synthesis URL with start/end if they are not already there
            const startSec = parseTimeToSeconds(startTime);
            const endSec = parseTimeToSeconds(endTime);

            if (startSec > 0 || endSec > 0) {
                const urlObj = new URL(linkUrl.includes('://') ? linkUrl : `https://${linkUrl}`);
                if (startSec > 0) urlObj.searchParams.set('t', startSec.toString());
                if (endSec > 0) urlObj.searchParams.set('end', endSec.toString());
                finalUrl = urlObj.toString();
            }

            if (targetFolderId === 'NEW_FOLDER') {
                if (!folderName.trim()) return;
                const newId = await createFolder(reqId, folderName);
                if (newId) {
                    finalFolderId = newId;
                } else {
                    return; // Stop if creation failed
                }
            }

            addMedia(reqId, 'video', linkTitle, finalUrl || '#', finalFolderId, linkNotes);
            setLinkTitle('');
            setLinkUrl('');
            setLinkNotes('');
            setStartTime('');
            setEndTime('');
            setTargetFolderId(undefined);
            setFolderName('');
            setIsAddLinkOpen(false);
        }
    };

    const handleUpdateMedia = async () => {
        if (editingMedia && linkTitle) {
            let finalUrl = linkUrl;
            const startSec = parseTimeToSeconds(startTime);
            const endSec = parseTimeToSeconds(endTime);

            if (startSec > 0 || endSec > 0) {
                try {
                    const urlObj = new URL(linkUrl.includes('://') ? linkUrl : `https://${linkUrl}`);
                    if (startSec > 0) urlObj.searchParams.set('t', startSec.toString());
                    else urlObj.searchParams.delete('t');

                    if (endSec > 0) urlObj.searchParams.set('end', endSec.toString());
                    else urlObj.searchParams.delete('end');

                    finalUrl = urlObj.toString();
                } catch (e) {
                    console.error('Invalid URL during update synthesis');
                }
            }

            await updateMedia(reqId, editingMedia.id, {
                title: linkTitle,
                url: finalUrl,
                notes: linkNotes,
                folderId: targetFolderId === 'NEW_FOLDER' ? undefined : (targetFolderId || undefined)
            });
            setEditingMedia(null);
            setLinkTitle('');
            setLinkUrl('');
            setLinkNotes('');
            setStartTime('');
            setEndTime('');
            setTargetFolderId(undefined);
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
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    const getYoutubeStartTime = (url: string) => {
        if (!url) return 0;
        const match = url.match(/[?&]t=([^&]+)/);
        if (!match) return 0;

        const timeStr = match[1];
        // Plain seconds
        if (/^\d+$/.test(timeStr)) return parseInt(timeStr);

        // Minutes/Seconds/Hours format (e.g. 1h2m3s)
        let totalSeconds = 0;
        const hMatch = timeStr.match(/(\d+)h/);
        const mMatch = timeStr.match(/(\d+)m/);
        const sMatch = timeStr.match(/(\d+)s/);

        if (hMatch) totalSeconds += parseInt(hMatch[1]) * 3600;
        if (mMatch) totalSeconds += parseInt(mMatch[1]) * 60;
        if (sMatch) totalSeconds += parseInt(sMatch[1]);

        return totalSeconds;
    };

    const getYoutubeEndTime = (url: string) => {
        if (!url) return 0;
        const match = url.match(/[?&]end=([^&]+)/);
        if (!match) return 0;
        return parseInt(match[1]) || 0;
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

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            reorderMedia(reqId, active.id as string, over.id as string);
        }
    };

    const SortableMediaItem = ({ item, children }: { item: MediaItem, children: React.ReactNode }) => {
        const {
            attributes,
            listeners,
            setNodeRef,
            transform,
            transition,
            isDragging
        } = useSortable({ id: item.id });

        const style = {
            transform: CSS.Transform.toString(transform),
            transition,
            zIndex: isDragging ? 50 : undefined,
            opacity: isDragging ? 0.5 : undefined,
        };

        return (
            <div ref={setNodeRef} style={style} className="relative group">
                {/* Drag Handle - absolute over the thumbnail */}
                <div
                    {...attributes}
                    {...listeners}
                    className="absolute top-2 left-2 z-30 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 p-1.5 rounded-md backdrop-blur-sm cursor-grab active:cursor-grabbing shadow-lg border border-white/10"
                >
                    <GripVertical size={14} className="text-white" />
                </div>
                {children}
            </div>
        );
    };

    const renderPlayerModal = () => {
        if (!activeMedia) return null;

        const isPlaceholder = activeMedia.id === 'EMPTY_PLACEHOLDER';
        const youtubeId = !isPlaceholder ? getYoutubeId(activeMedia.url) : null;
        const youtubeStartTime = !isPlaceholder ? getYoutubeStartTime(activeMedia.url) : 0;
        const youtubeEndTime = !isPlaceholder ? getYoutubeEndTime(activeMedia.url) : 0;

        // Calculate auto-end for chapters
        const chapters = parseChapters(mediaNotes);
        const currentChapterIndex = playerSeekTime !== null ? chapters.findIndex(c => c.time === playerSeekTime) : -1;
        const nextChapterTime = currentChapterIndex !== -1 && chapters[currentChapterIndex + 1]
            ? chapters[currentChapterIndex + 1].time
            : 0;

        const effectiveEndTime = nextChapterTime > 0 ? nextChapterTime : youtubeEndTime;
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
                                            src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1${(playerSeekTime ?? youtubeStartTime) > 0 ? `&start=${playerSeekTime ?? youtubeStartTime}` : ''}${effectiveEndTime > 0 ? `&end=${effectiveEndTime}` : ''}`}
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
                                                <span className={youtubeId ? 'text-red-500 font-medium' : tiktokId ? 'text-cyan-400 font-medium' : 'text-slate-50'}>
                                                    {youtubeId ? 'YouTube' : tiktokId ? 'TikTok' : 'Link'}
                                                </span>
                                                <span>•</span>
                                            </>
                                        )}
                                        <span>{folderName}</span>
                                    </div>
                                </div>

                                {/* Sidebar Navigation Tabs */}
                                <div className="flex border-b border-slate-100 bg-white sticky top-0 z-10 shrink-0">
                                    <button
                                        onClick={() => setSidebarTab('playlist')}
                                        className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${sidebarTab === 'playlist' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                                    >
                                        <div className="flex items-center justify-center gap-2">
                                            <ListVideo size={14} />
                                            Geral
                                        </div>
                                    </button>
                                    <button
                                        onClick={() => setSidebarTab('chapters')}
                                        className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${sidebarTab === 'chapters' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                                    >
                                        <div className="flex items-center justify-center gap-2">
                                            <Play size={14} />
                                            Capítulos
                                        </div>
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto">
                                    {sidebarTab === 'playlist' ? (
                                        /* 1. Geral Tab: Notes + Playlist */
                                        <div className="flex flex-col min-h-full bg-white">
                                            {/* Video Notes Section */}
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
                                                    className="w-full h-24 min-h-[80px] bg-slate-50 border-slate-200 text-slate-900 text-[13px] placeholder:text-slate-400 resize-none focus:ring-1 focus:ring-blue-500 p-3 leading-relaxed rounded-lg shadow-sm disabled:opacity-50"
                                                />
                                            </div>

                                            {/* Playlist Items */}
                                            <div className="flex flex-col pb-4 flex-1">
                                                <div className="px-4 py-3 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Ordem de Estudo</span>
                                                    <span className="text-[10px] text-slate-400 font-mono">{currentIndex + 1} / {totalCount}</span>
                                                </div>
                                                {allPlayableMedia.map((media, index) => {
                                                    const isActive = media.id === activeMedia.id;
                                                    const yId = getYoutubeId(media.url);
                                                    const tId = getTikTokId(media.url);

                                                    return (
                                                        <button
                                                            key={media.id}
                                                            ref={isActive ? activeItemRef : null}
                                                            onClick={() => setActiveMedia(media)}
                                                            className={`flex items-start gap-3 p-3 text-left transition-colors border-b border-slate-50 last:border-0 ${isActive ? 'bg-blue-50 hover:bg-blue-50/80' : 'hover:bg-slate-50'}`}
                                                        >
                                                            {/* Thumbnail */}
                                                            <div className="relative w-20 aspect-video rounded overflow-hidden bg-slate-200 shrink-0 ring-1 ring-black/5">
                                                                {yId ? (
                                                                    <img src={`https://img.youtube.com/vi/${yId}/mqdefault.jpg`} className="w-full h-full object-cover opacity-90" />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center bg-slate-100"><Video size={12} className="text-slate-400" /></div>
                                                                )}
                                                                {isActive && (
                                                                    <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center backdrop-blur-[1px]">
                                                                        <Play size={12} className="text-white fill-current" />
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* Text Info */}
                                                            <div className="flex-1 min-w-0 pt-0.5">
                                                                <h4 className={`text-xs font-semibold leading-tight line-clamp-2 ${isActive ? 'text-blue-700' : 'text-slate-700'}`}>
                                                                    {media.title}
                                                                </h4>
                                                                <p className="text-[9px] text-slate-400 mt-0.5 truncate tracking-tighter uppercase font-medium">
                                                                    {isActive ? 'Assistindo agora' : media.folderName}
                                                                </p>
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ) : (
                                        /* 2. Capítulos Tab: Visual Chapter List */
                                        <div className="flex flex-col h-full bg-slate-50/30">
                                            {!isPlaceholder && youtubeId && (
                                                <>
                                                    {/* Compact Add Chapter Form */}
                                                    <div className="p-3 bg-white border-b border-slate-100 sticky top-0 z-10 shadow-sm">
                                                        <div className="flex gap-1.5">
                                                            <Input
                                                                placeholder="Novo capítulo..."
                                                                value={newChapterTitle}
                                                                onChange={e => setNewChapterTitle(e.target.value)}
                                                                className="h-8 text-xs flex-1"
                                                            />
                                                            <Input
                                                                placeholder="01:20"
                                                                value={newChapterTime}
                                                                onChange={e => setNewChapterTime(e.target.value)}
                                                                className="h-8 text-xs w-16 tabular-nums"
                                                            />
                                                            <Button
                                                                size="sm"
                                                                className="h-8 w-8 p-0 shrink-0 bg-blue-600 hover:bg-blue-700"
                                                                onClick={() => {
                                                                    if (!newChapterTitle || !newChapterTime) return;

                                                                    // Parse existing chapters to ensure we can sort correctly
                                                                    const currentChapters = parseChapters(mediaChapters);
                                                                    const newChapter = {
                                                                        time: parseTimeToSeconds(newChapterTime),
                                                                        title: newChapterTitle
                                                                    };

                                                                    const updated = [...currentChapters, newChapter].sort((a, b) => a.time - b.time);
                                                                    const formatted = updated.map(c => `${formatSecondsToTime(c.time)} - ${c.title}`).join('\n');

                                                                    setMediaChapters(formatted);
                                                                    updateMediaChapters(reqId, activeMedia.id, formatted);
                                                                    setNewChapterTitle('');
                                                                    setNewChapterTime('');
                                                                }}
                                                            >
                                                                <Plus size={14} />
                                                            </Button>
                                                        </div>
                                                    </div>

                                                    {/* Visual Chapters List */}
                                                    <div className="flex-1 py-1">
                                                        {(() => {
                                                            const chapters = parseChapters(mediaChapters);
                                                            if (chapters.length === 0) {
                                                                return (
                                                                    <div className="p-8 text-center bg-white m-3 rounded-xl border-2 border-dashed border-slate-100">
                                                                        <ListVideo className="mx-auto mb-2 text-slate-200" size={32} />
                                                                        <p className="text-xs text-slate-500 font-medium whitespace-pre-wrap">Nenhum capítulo cadastrado</p>
                                                                        <p className="text-[10px] text-slate-400 mt-1">Facilite seu estudo mapeando os pontos principais.</p>
                                                                    </div>
                                                                );
                                                            }
                                                            return (
                                                                <div className="flex flex-col px-2 gap-1.5">
                                                                    {chapters.map((ch, i) => {
                                                                        const isCurrent = playerSeekTime === ch.time;
                                                                        return (
                                                                            <button
                                                                                key={i}
                                                                                onClick={() => setPlayerSeekTime(ch.time)}
                                                                                className={`group flex items-start gap-3 p-2 rounded-lg transition-all text-left ${isCurrent ? 'bg-blue-600 shadow-md ring-1 ring-blue-700/50' : 'bg-white hover:bg-slate-50 border border-slate-100 shadow-sm'}`}
                                                                            >
                                                                                {/* Thumbnail Preview Area (matching reference) */}
                                                                                <div className="relative w-28 aspect-video rounded-md overflow-hidden bg-slate-900 shrink-0">
                                                                                    <img
                                                                                        src={`https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`}
                                                                                        className={`w-full h-full object-cover ${isCurrent ? 'opacity-90' : 'opacity-70 group-hover:opacity-90'}`}
                                                                                    />
                                                                                    {/* Timestamp Badge overlay (bottom left, as in reference) */}
                                                                                    {editingChapterIndex === i ? (
                                                                                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center p-1">
                                                                                            <Input
                                                                                                value={editingChapterTime}
                                                                                                onChange={e => setEditingChapterTime(e.target.value)}
                                                                                                className="h-6 text-[10px] bg-white text-slate-900 border-0 focus:ring-1 focus:ring-blue-500 font-bold text-center px-1"
                                                                                                autoFocus
                                                                                            />
                                                                                        </div>
                                                                                    ) : (
                                                                                        <div className="absolute bottom-1.5 left-1.5 bg-blue-600/90 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm backdrop-blur-[2px]">
                                                                                            {formatSecondsToTime(ch.time)}
                                                                                        </div>
                                                                                    )}

                                                                                    {/* Play Hover/Active overlay (only if not editing) */}
                                                                                    {editingChapterIndex !== i && (
                                                                                        <div className={`absolute inset-0 flex items-center justify-center transition-opacity ${isCurrent ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                                                                            <div className="bg-white/20 p-1.5 rounded-full backdrop-blur-[4px] border border-white/30">
                                                                                                <Play size={14} className="text-white fill-current" />
                                                                                            </div>
                                                                                        </div>
                                                                                    )}
                                                                                </div>

                                                                                {/* Chapter Info */}
                                                                                <div className="flex-1 min-w-0 pt-1 relative h-full flex flex-col justify-between pr-6">
                                                                                    {editingChapterIndex === i ? (
                                                                                        <div className="flex flex-col gap-1.5">
                                                                                            <Input
                                                                                                value={editingChapterTitle}
                                                                                                onChange={e => setEditingChapterTitle(e.target.value)}
                                                                                                className="h-7 text-xs bg-white text-slate-900 border-slate-200 focus:ring-1 focus:ring-blue-500"
                                                                                                placeholder="Título do capítulo"
                                                                                            />
                                                                                            <div className="flex gap-1">
                                                                                                <Button
                                                                                                    size="sm"
                                                                                                    className="h-6 flex-1 text-[10px] bg-green-600 hover:bg-green-700 text-white"
                                                                                                    onClick={(e) => {
                                                                                                        e.stopPropagation();
                                                                                                        if (!editingChapterTitle || !editingChapterTime) return;

                                                                                                        const currentChapters = parseChapters(mediaChapters);
                                                                                                        const updatedChapters = [...currentChapters];
                                                                                                        updatedChapters[i] = {
                                                                                                            time: parseTimeToSeconds(editingChapterTime),
                                                                                                            title: editingChapterTitle
                                                                                                        };

                                                                                                        // Sort after edit to maintain chronological order
                                                                                                        updatedChapters.sort((a, b) => a.time - b.time);

                                                                                                        const formatted = updatedChapters.map(c =>
                                                                                                            `${formatSecondsToTime(c.time)} - ${c.title}`
                                                                                                        ).join('\n');

                                                                                                        setMediaChapters(formatted);
                                                                                                        updateMediaChapters(reqId, activeMedia.id, formatted);
                                                                                                        setEditingChapterIndex(null);
                                                                                                    }}
                                                                                                >
                                                                                                    Salvar
                                                                                                </Button>
                                                                                                <Button
                                                                                                    size="sm"
                                                                                                    variant="ghost"
                                                                                                    className="h-6 flex-1 text-[10px] text-slate-500 hover:text-slate-700"
                                                                                                    onClick={(e) => {
                                                                                                        e.stopPropagation();
                                                                                                        setEditingChapterIndex(null);
                                                                                                    }}
                                                                                                >
                                                                                                    Cancelar
                                                                                                </Button>
                                                                                            </div>
                                                                                        </div>
                                                                                    ) : (
                                                                                        <>
                                                                                            <div className={`text-[13px] font-semibold leading-relaxed line-clamp-2 ${isCurrent ? 'text-white' : 'text-slate-800'}`}>
                                                                                                {ch.title}
                                                                                            </div>

                                                                                            {/* Action Buttons (Edit/Delete) */}
                                                                                            <div className={`absolute top-0 right-0 flex flex-col gap-1 transition-opacity ${isCurrent ? 'text-white/60' : 'opacity-0 group-hover:opacity-100'}`}>
                                                                                                <Button
                                                                                                    size="icon"
                                                                                                    variant="ghost"
                                                                                                    className={`h-6 w-6 ${isCurrent ? 'hover:text-white hover:bg-white/10' : 'text-slate-300 hover:text-blue-500 hover:bg-blue-50'}`}
                                                                                                    onClick={(e) => {
                                                                                                        e.stopPropagation();
                                                                                                        setEditingChapterIndex(i);
                                                                                                        setEditingChapterTitle(ch.title);
                                                                                                        setEditingChapterTime(formatSecondsToTime(ch.time));
                                                                                                    }}
                                                                                                >
                                                                                                    <Pencil size={12} />
                                                                                                </Button>
                                                                                                <Button
                                                                                                    size="icon"
                                                                                                    variant="ghost"
                                                                                                    className={`h-6 w-6 ${isCurrent ? 'hover:text-white hover:bg-white/10' : 'text-slate-300 hover:text-red-500 hover:bg-red-50'}`}
                                                                                                    onClick={(e) => {
                                                                                                        e.stopPropagation();
                                                                                                        const chapters = parseChapters(mediaChapters);
                                                                                                        const updated = chapters.filter((_, idx) => idx !== i)
                                                                                                            .map(c => `${formatSecondsToTime(c.time)} - ${c.title}`).join('\n');
                                                                                                        setMediaChapters(updated);
                                                                                                        updateMediaChapters(reqId, activeMedia.id, updated);
                                                                                                    }}
                                                                                                >
                                                                                                    <Trash2 size={12} />
                                                                                                </Button>
                                                                                            </div>
                                                                                        </>
                                                                                    )}
                                                                                </div>
                                                                            </button>
                                                                        );
                                                                    })}
                                                                </div>
                                                            );
                                                        })()}
                                                    </div>
                                                </>
                                            )}

                                            {(!youtubeId || isPlaceholder) && (
                                                <div className="p-8 text-center m-4 text-slate-400 italic text-sm">
                                                    Capítulos disponíveis apenas para vídeos do YouTube.
                                                </div>
                                            )}
                                        </div>
                                    )}
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
                                            <ChevronLeft className="mr-2" size={16} />
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
                            setLinkNotes('');
                            setStartTime('');
                            setEndTime('');
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
                                <Input
                                    placeholder="URL (YouTube)"
                                    value={linkUrl}
                                    onChange={e => {
                                        const val = e.target.value;
                                        setLinkUrl(val);
                                        // Auto-detect start time from URL
                                        const detectedStart = getYoutubeStartTime(val);
                                        if (detectedStart > 0 && !startTime) {
                                            setStartTime(formatSecondsToTime(detectedStart));
                                        }
                                        const detectedEnd = getYoutubeEndTime(val);
                                        if (detectedEnd > 0 && !endTime) {
                                            setEndTime(formatSecondsToTime(detectedEnd));
                                        }
                                    }}
                                />

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-1.5">
                                        <label className="text-xs font-medium text-slate-500 uppercase">Início (MM:SS)</label>
                                        <Input placeholder="00:00" value={startTime} onChange={e => setStartTime(e.target.value)} />
                                    </div>
                                    <div className="grid gap-1.5">
                                        <label className="text-xs font-medium text-slate-500 uppercase">Fim (MM:SS)</label>
                                        <Input placeholder="Opcional" value={endTime} onChange={e => setEndTime(e.target.value)} />
                                    </div>
                                </div>

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

                                <div className="grid gap-2">
                                    <label className="text-sm font-medium text-slate-700">Anotações (Opcional)</label>
                                    <Textarea
                                        placeholder="Dicas, timestamps importantes ou observações..."
                                        value={linkNotes}
                                        onChange={e => setLinkNotes(e.target.value)}
                                        className="h-24 resize-none"
                                    />
                                </div>
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

            {/* Edit Media Modal */}
            <Dialog open={!!editingMedia} onOpenChange={(open) => {
                if (!open) {
                    setEditingMedia(null);
                    setLinkTitle('');
                    setLinkUrl('');
                    setLinkNotes('');
                    setStartTime('');
                    setEndTime('');
                    setTargetFolderId(undefined);
                }
            }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Editar Conteúdo</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <label className="text-sm font-medium text-slate-700">Título</label>
                            <Input placeholder="Título" value={linkTitle} onChange={e => setLinkTitle(e.target.value)} />
                        </div>
                        <div className="grid gap-2">
                            <label className="text-sm font-medium text-slate-700">URL</label>
                            <Input placeholder="URL (YouTube/TikTok)" value={linkUrl} onChange={e => setLinkUrl(e.target.value)} />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-1.5">
                                <label className="text-xs font-medium text-slate-700">Início (Ex: 01:20)</label>
                                <Input
                                    placeholder="00:00"
                                    value={startTime}
                                    onChange={e => setStartTime(e.target.value)}
                                />
                            </div>
                            <div className="grid gap-1.5">
                                <label className="text-xs font-medium text-slate-700">Fim (Opcional)</label>
                                <Input
                                    placeholder="MM:SS"
                                    value={endTime}
                                    onChange={e => setEndTime(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <label className="text-sm font-medium text-slate-700">Pasta</label>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={targetFolderId || ''}
                                onChange={e => setTargetFolderId(e.target.value || undefined)}
                            >
                                <option value="">Sem pasta (Raiz)</option>
                                {folders.map(f => (
                                    <option key={f.id} value={f.id}>{f.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="grid gap-2">
                            <label className="text-sm font-medium text-slate-700">Anotações</label>
                            <Textarea
                                placeholder="Dicas ou observações..."
                                value={linkNotes}
                                onChange={e => setLinkNotes(e.target.value)}
                                className="h-32 resize-none"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingMedia(null)}>Cancelar</Button>
                        <Button onClick={handleUpdateMedia}>Salvar Alterações</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <div className="overflow-y-auto pr-2 pb-10 flex-1">
                <div className={viewMode === 'grid' ? 'grid grid-cols-2 lg:grid-cols-4 gap-4' : 'space-y-4'}>
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
                                    <div className={`p-2 ${viewMode === 'grid' ? 'grid grid-cols-2 lg:grid-cols-4 gap-4' : 'space-y-2'}`}>
                                        {folderMedia.length === 0 && <p className="text-xs text-slate-400 italic pl-6 col-span-full">Vazia</p>}
                                        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                                            <SortableContext items={folderMedia.map(m => m.id)} strategy={viewMode === 'grid' ? rectSortingStrategy : verticalListSortingStrategy}>
                                                {folderMedia.map(item => (
                                                    <SortableMediaItem key={item.id} item={item}>
                                                        <div className={`${viewMode === 'list' ? 'flex items-start gap-3 p-2 hover:bg-slate-50 rounded-md transition-colors' : 'flex flex-col gap-2 border rounded-md p-2 hover:border-blue-300 transition-colors'} group relative h-full bg-white`}>
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

                                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <Button
                                                                    size="icon"
                                                                    variant="ghost"
                                                                    className="h-6 w-6 text-slate-400 hover:text-blue-600"
                                                                    onClick={() => {
                                                                        setEditingMedia(item);
                                                                        setLinkTitle(item.title);
                                                                        setLinkUrl(item.url);
                                                                        setLinkNotes(item.notes || '');

                                                                        const start = getYoutubeStartTime(item.url);
                                                                        const end = getYoutubeEndTime(item.url);
                                                                        setStartTime(start > 0 ? formatSecondsToTime(start) : '');
                                                                        setEndTime(end > 0 ? formatSecondsToTime(end) : '');

                                                                        setTargetFolderId(item.folderId || '');
                                                                    }}
                                                                >
                                                                    <Pencil size={14} />
                                                                </Button>
                                                                <Button
                                                                    size="icon"
                                                                    variant="ghost"
                                                                    className="h-6 w-6 text-slate-400 hover:text-red-500"
                                                                    onClick={() => removeMedia(reqId, item.id)}
                                                                >
                                                                    <Trash2 size={14} />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </SortableMediaItem>
                                                ))}
                                            </SortableContext>
                                        </DndContext>
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {/* Root Media */}
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                        <SortableContext items={rootMedia.map(m => m.id)} strategy={viewMode === 'grid' ? rectSortingStrategy : verticalListSortingStrategy}>
                            {rootMedia.map(item => (
                                <SortableMediaItem key={item.id} item={item}>
                                    <div className={`${viewMode === 'list' ? 'flex items-start gap-3 p-2 border rounded-md bg-white hover:border-blue-300 transition-colors' : 'flex flex-col gap-2 border rounded-md p-2 bg-white hover:border-blue-300 transition-colors'} group relative h-full bg-white`}>

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

                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-8 w-8 text-slate-400 hover:text-blue-600"
                                                onClick={() => {
                                                    setEditingMedia(item);
                                                    setLinkTitle(item.title);
                                                    setLinkUrl(item.url);
                                                    setLinkNotes(item.notes || '');

                                                    const start = getYoutubeStartTime(item.url);
                                                    const end = getYoutubeEndTime(item.url);
                                                    setStartTime(start > 0 ? formatSecondsToTime(start) : '');
                                                    setEndTime(end > 0 ? formatSecondsToTime(end) : '');

                                                    setTargetFolderId(item.folderId || '');
                                                }}
                                            >
                                                <Pencil size={16} />
                                            </Button>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-8 w-8 text-slate-400 hover:text-red-500"
                                                onClick={() => removeMedia(reqId, item.id)}
                                            >
                                                <Trash2 size={16} />
                                            </Button>
                                        </div>
                                    </div>
                                </SortableMediaItem>
                            ))}
                        </SortableContext>
                    </DndContext>
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
