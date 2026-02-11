'use client';

import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { ExamRequirement, UserRequirementState, UserGroup, LearningStatus } from '@/types/exam';
import { EXAM_REQUIREMENTS } from '@/data/exam-requirements';

// Database response types
interface DBUserProgress {
    requirement_id: number;
    status: string;
    notes: string | null;
}

interface DBUserFolder {
    id: string;
    requirement_id: number;
    name: string;
}

interface DBUserMedia {
    id: string;
    requirement_id: number;
    type: string;
    title: string;
    url: string;
    notes: string | null;
    folder_id: string | null;
}

interface DBUserGroup {
    id: string;
    name: string;
    requirement_ids: number[];
    collapsed: boolean;
}

import { v4 as uuidv4 } from 'uuid';

interface ExamStore {
    // Data
    requirements: ExamRequirement[];
    userState: Record<number, UserRequirementState>;
    groups: Record<string, UserGroup>;
    listOrder: (number | string)[]; // Can be reqId (number) or groupId (string)

    // UI State
    isLoading: boolean;
    selectedIds: number[];
    lastSelectedId: number | null;
    activeRequirementId: number | null; // Currently viewing details
    selectionTriggeredByShift: boolean;

    // Actions - Init
    init: () => Promise<void>;

    // Actions - Selection
    selectItem: (id: number, multi?: boolean, range?: boolean) => void;
    clearSelection: () => void;
    setActiveRequirement: (id: number | null) => void;

    // Actions - Grouping
    createGroup: (name: string) => void;
    ungroup: (groupId: string) => void;
    moveItem: (activeId: string | number, overId: string | number) => void;
    reorderList: (oldIndex: number, newIndex: number) => void;
    toggleGroupCollapse: (groupId: string) => void;

    // Actions - User Data
    updateStatus: (reqId: number, status: LearningStatus) => void;
    updateNotes: (reqId: number, notes: string) => void;
    updateMediaNotes: (reqId: number, mediaId: string, notes: string) => void;
    addMedia: (reqId: number, type: 'video' | 'link', title: string, url: string, folderId?: string) => void;
    removeMedia: (reqId: number, mediaId: string) => void;
    createFolder: (reqId: number, name: string) => Promise<string | undefined>;
    removeFolder: (reqId: number, folderId: string) => void;

    // Reset
    reset: () => void;

    // Internal Helper
    syncSettings: (settings: Record<string, unknown>) => Promise<void>;
}

const INITIAL_STATE = {
    requirements: EXAM_REQUIREMENTS,
    userState: {},
    groups: {},
    listOrder: EXAM_REQUIREMENTS.map(r => r.id),
    isLoading: true,
    selectedIds: [],
    lastSelectedId: null,
    activeRequirementId: null,
    selectionTriggeredByShift: false,
};

export const useExamStore = create<ExamStore>((set, get) => ({
    ...INITIAL_STATE,

    init: async () => {
        set({ isLoading: true });

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                set({ isLoading: false });
                return;
            }

            const userId = session.user.id;

            // Fetch all data in parallel
            const [progressRes, groupsRes, foldersRes, mediaRes, settingsRes] = await Promise.all([
                supabase.from('user_progress').select('*').eq('user_id', userId),
                supabase.from('user_groups').select('*').eq('user_id', userId),
                supabase.from('user_folders').select('*').eq('user_id', userId),
                supabase.from('user_media').select('*').eq('user_id', userId),
                supabase.from('user_settings').select('*').eq('user_id', userId).single()
            ]);

            // Reconstruct UserState
            const userState: Record<number, UserRequirementState> = {};

            // 1. Progress & Notes
            progressRes.data?.forEach((p: DBUserProgress) => {
                userState[p.requirement_id] = {
                    reqId: p.requirement_id,
                    status: p.status as LearningStatus,
                    notes: p.notes || '',
                    media: [],
                    folders: []
                };
            });

            // 2. Folders
            foldersRes.data?.forEach((f: DBUserFolder) => {
                if (!userState[f.requirement_id]) {
                    userState[f.requirement_id] = { reqId: f.requirement_id, status: 'todo', notes: '', media: [], folders: [] };
                }
                userState[f.requirement_id].folders.push({
                    id: f.id,
                    name: f.name
                });
            });

            // 3. Media
            mediaRes.data?.forEach((m: DBUserMedia) => {
                if (!userState[m.requirement_id]) {
                    userState[m.requirement_id] = { reqId: m.requirement_id, status: 'todo', notes: '', media: [], folders: [] };
                }
                userState[m.requirement_id].media.push({
                    id: m.id,
                    type: m.type as 'video' | 'link',
                    title: m.title,
                    url: m.url,
                    notes: m.notes || undefined,
                    folderId: m.folder_id || undefined
                });
            });

            // Reconstruct Groups
            const groups: Record<string, UserGroup> = {};
            groupsRes.data?.forEach((g: DBUserGroup) => {
                groups[g.id] = {
                    id: g.id,
                    name: g.name,
                    requirementIds: g.requirement_ids || [],
                    collapsed: g.collapsed || false
                };
            });

            // Settings (List Order)
            let listOrder = INITIAL_STATE.listOrder;
            let selectedIds = INITIAL_STATE.selectedIds;
            let activeRequirementId = INITIAL_STATE.activeRequirementId;

            if (settingsRes.data) {
                if (settingsRes.data.list_order) {
                    listOrder = settingsRes.data.list_order;
                }
                if (settingsRes.data.selected_ids) {
                    selectedIds = settingsRes.data.selected_ids;
                }
                if (settingsRes.data.active_requirement_id) {
                    activeRequirementId = settingsRes.data.active_requirement_id;
                }
            }

            set({
                userState,
                groups,
                listOrder,
                selectedIds,
                activeRequirementId,
                isLoading: false
            });

        } catch (error) {
            console.error('Failed to init store:', error);
            set({ isLoading: false });
        }
    },

    selectItem: (id, multi = false, range = false) => {
        const { selectedIds, lastSelectedId, listOrder, groups } = get();
        let newSelection = [...selectedIds];

        if (range && lastSelectedId !== null) {
            // Range Selection logic
            const flattenedOrder: number[] = [];
            listOrder.forEach(itemId => {
                if (typeof itemId === 'number') {
                    flattenedOrder.push(itemId);
                } else {
                    const group = groups[itemId];
                    if (group) {
                        flattenedOrder.push(...group.requirementIds);
                    }
                }
            });

            const startIdx = flattenedOrder.indexOf(lastSelectedId);
            const endIdx = flattenedOrder.indexOf(id);

            if (startIdx !== -1 && endIdx !== -1) {
                const start = Math.min(startIdx, endIdx);
                const end = Math.max(startIdx, endIdx);
                const rangeIds = flattenedOrder.slice(start, end + 1);
                newSelection = Array.from(new Set([...newSelection, ...rangeIds]));
            }
        } else if (multi) {
            if (newSelection.includes(id)) {
                newSelection = newSelection.filter(i => i !== id);
            } else {
                newSelection.push(id);
            }
        } else {
            newSelection = [id];
        }

        set({
            selectedIds: newSelection,
            lastSelectedId: id,
            activeRequirementId: id,
            selectionTriggeredByShift: range
        });

        // Sync Settings
        get().syncSettings({ selected_ids: newSelection, active_requirement_id: id });
    },

    clearSelection: () => {
        set({ selectedIds: [], lastSelectedId: null });
        get().syncSettings({ selected_ids: [] });
    },

    setActiveRequirement: (id) => {
        set({ activeRequirementId: id });
        get().syncSettings({ active_requirement_id: id });
    },

    createGroup: async (name) => {
        const { selectedIds, listOrder, groups } = get();
        if (selectedIds.length === 0) return;

        const groupId = uuidv4(); // Generate valid UUID
        const newGroup: UserGroup = {
            id: groupId,
            name,
            requirementIds: [...selectedIds].sort((a, b) => {
                return EXAM_REQUIREMENTS.findIndex(r => r.id === a) - EXAM_REQUIREMENTS.findIndex(r => r.id === b);
            }),
            collapsed: false
        };

        const firstIdx = listOrder.findIndex(item => selectedIds.includes(item as number));
        const newListOrder = listOrder.filter(item => !selectedIds.includes(item as number));

        if (firstIdx !== -1) {
            newListOrder.splice(firstIdx, 0, groupId);
        } else {
            newListOrder.push(groupId);
        }

        set({
            groups: { ...groups, [groupId]: newGroup },
            listOrder: newListOrder,
            selectedIds: [],
            activeRequirementId: null
        });

        // Supabase Sync
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            // 1. Create Group with explicit ID
            await supabase.from('user_groups').insert({
                id: groupId, // Use the same UUID
                user_id: session.user.id,
                name,
                requirement_ids: newGroup.requirementIds,
                collapsed: false,
            });

            // 2. Update list order immediately to ensure consistency
            get().syncSettings({ list_order: newListOrder });
        }
    },

    ungroup: async (groupId) => {
        const { groups, listOrder } = get();
        const group = groups[groupId];
        if (!group) return;

        const groupIdx = listOrder.indexOf(groupId);
        const newListOrder = [...listOrder];

        newListOrder.splice(groupIdx, 1, ...group.requirementIds);

        const newGroups = { ...groups };
        delete newGroups[groupId];

        set({ groups: newGroups, listOrder: newListOrder });

        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            await supabase.from('user_groups').delete().eq('id', groupId).eq('user_id', session.user.id);
            get().syncSettings({ list_order: newListOrder });
        }
    },

    moveItem: (activeId, overId) => {
        get().reorderList(
            get().listOrder.indexOf(activeId),
            get().listOrder.indexOf(overId)
        );
    },

    reorderList: (oldIndex, newIndex) => {
        set((state) => {
            const newOrder = [...state.listOrder];
            const [movedItem] = newOrder.splice(oldIndex, 1);
            newOrder.splice(newIndex, 0, movedItem);
            return { listOrder: newOrder };
        });
        get().syncSettings({ list_order: get().listOrder });
    },

    toggleGroupCollapse: async (groupId) => {
        set((state) => ({
            groups: {
                ...state.groups,
                [groupId]: {
                    ...state.groups[groupId],
                    collapsed: !state.groups[groupId].collapsed
                }
            }
        }));

        const group = get().groups[groupId];
        const { data: { session } } = await supabase.auth.getSession();
        if (session && group) {
            await supabase.from('user_groups').update({
                collapsed: group.collapsed
            }).eq('id', groupId).eq('user_id', session.user.id);
        }
    },

    updateStatus: async (reqId, status) => {
        set((state) => ({
            userState: {
                ...state.userState,
                [reqId]: {
                    ...state.userState[reqId],
                    reqId,
                    status
                }
            }
        }));

        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            const current = get().userState[reqId];
            await supabase.from('user_progress').upsert({
                user_id: session.user.id,
                requirement_id: reqId,
                status,
                notes: current?.notes || ''
            });
        }
    },

    updateNotes: async (reqId, notes) => {
        set((state) => ({
            userState: {
                ...state.userState,
                [reqId]: {
                    ...state.userState[reqId],
                    reqId,
                    notes
                }
            }
        }));

        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            const current = get().userState[reqId];
            await supabase.from('user_progress').upsert({
                user_id: session.user.id,
                requirement_id: reqId,
                status: current?.status || 'todo',
                notes
            });
        }
    },

    updateMediaNotes: async (reqId, mediaId, notes) => {
        set((state) => {
            const currentState = state.userState[reqId];
            if (!currentState) return state;

            const media = (currentState.media || []).map(m =>
                m.id === mediaId ? { ...m, notes } : m
            );

            return {
                userState: {
                    ...state.userState,
                    [reqId]: {
                        ...currentState,
                        media
                    }
                }
            };
        });

        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            await supabase.from('user_media').update({ notes }).eq('id', mediaId).eq('user_id', session.user.id);
        }
    },

    addMedia: async (reqId, type, title, url, folderId) => {
        const tempId = uuidv4(); // Generate valid UUID

        set((state) => {
            const currentState = state.userState[reqId] || { reqId, status: 'todo', notes: '', media: [], folders: [] };
            const currentMedia = currentState.media || [];
            return {
                userState: {
                    ...state.userState,
                    [reqId]: {
                        ...currentState,
                        media: [...currentMedia, { id: tempId, type, title, url, notes: '', folderId }]
                    }
                }
            };
        });

        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            const { error } = await supabase.from('user_media').insert({
                id: tempId,
                user_id: session.user.id,
                requirement_id: reqId,
                type,
                title,
                url,
                notes: '',
                folder_id: folderId || null // Explicitly handle undefined
            });

            if (error) {
                console.error('Failed to add media:', error);
                // Revert optimistic update? For now just log.
            }
        }
    },

    removeMedia: async (reqId, mediaId) => {
        set((state) => {
            const currentState = state.userState[reqId];
            if (!currentState) return state;
            return {
                userState: {
                    ...state.userState,
                    [reqId]: {
                        ...currentState,
                        media: (currentState.media || []).filter(m => m.id !== mediaId)
                    }
                }
            };
        });

        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            const { error } = await supabase.from('user_media').delete().eq('id', mediaId).eq('user_id', session.user.id);
            if (error) {
                console.error('Failed to remove media:', error);
            }
        }
    },

    createFolder: async (reqId, name) => {
        const tempId = uuidv4(); // Generate valid UUID
        set((state) => {
            const currentState = state.userState[reqId] || { reqId, status: 'todo', notes: '', media: [], folders: [] };
            return {
                userState: {
                    ...state.userState,
                    [reqId]: {
                        ...currentState,
                        folders: [...(currentState.folders || []), { id: tempId, name }]
                    }
                }
            };
        });

        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            const { error } = await supabase.from('user_folders').insert({
                id: tempId,
                user_id: session.user.id,
                requirement_id: reqId,
                name
            });

            if (error) {
                console.error('Failed to create folder:', error);
            }
        }
        return tempId;
    },

    removeFolder: async (reqId, folderId) => {
        set((state) => {
            const currentState = state.userState[reqId];
            if (!currentState) return state;
            return {
                userState: {
                    ...state.userState,
                    [reqId]: {
                        ...currentState,
                        folders: (currentState.folders || []).filter(f => f.id !== folderId),
                        media: (currentState.media || []).map(m => m.folderId === folderId ? { ...m, folderId: undefined } : m)
                    }
                }
            };
        });

        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            const { error } = await supabase.from('user_folders').delete().eq('id', folderId).eq('user_id', session.user.id);
            if (error) {
                console.error('Failed to remove folder:', error);
            }
        }
    },

    reset: () => set(INITIAL_STATE),

    // Helper
    syncSettings: async (settings: Partial<DBUserGroup> | Record<string, unknown>) => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            const { error } = await supabase.from('user_settings').upsert({
                user_id: session.user.id,
                updated_at: new Date().toISOString(),
                ...settings
            });
            if (error) {
                console.error('Failed to sync settings:', error);
            }
        }
    }
}));
