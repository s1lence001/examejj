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
    chapters: string | null;
    folder_id: string | null;
    display_order: number;
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
    renameGroup: (groupId: string, name: string) => void;
    ungroup: (groupId: string) => void;
    moveItem: (activeId: string | number, overId: string | number) => void;
    reorderList: (oldIndex: number, newIndex: number) => void;
    toggleGroupCollapse: (groupId: string) => void;

    // Actions - User Data
    updateStatus: (reqId: number, status: LearningStatus) => void;
    updateNotes: (reqId: number, notes: string) => void;
    updateMediaNotes: (reqId: number, mediaId: string, notes: string) => void;
    updateMediaChapters: (reqId: number, mediaId: string, chapters: string) => void;
    addMedia: (reqId: number, type: 'video' | 'link', title: string, url: string, folderId?: string, notes?: string, chapters?: string) => void;
    updateMedia: (reqId: number, mediaId: string, data: { title?: string, url?: string, notes?: string, chapters?: string, folderId?: string }) => Promise<void>;
    removeMedia: (reqId: number, mediaId: string) => void;
    reorderMedia: (reqId: number, activeId: string, overId: string, folderId?: string) => void;
    createFolder: (reqId: number, name: string) => Promise<string | undefined>;
    removeFolder: (reqId: number, folderId: string) => void;

    // Export/Import
    exportData: () => string;
    importData: (jsonData: string) => Promise<void>;

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
                    chapters: m.chapters || undefined,
                    folderId: m.folder_id || undefined,
                    displayOrder: m.display_order || 0
                });
            });

            // Sort media by displayOrder
            Object.values(userState).forEach(state => {
                state.media.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
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

    renameGroup: async (groupId, name) => {
        set((state) => ({
            groups: {
                ...state.groups,
                [groupId]: { ...state.groups[groupId], name }
            }
        }));

        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            const { error } = await supabase.from('user_groups').update({ name }).eq('id', groupId).eq('user_id', session.user.id);
            if (error) {
                console.error('Failed to rename group:', error);
            }
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
        const { listOrder, groups } = get();

        // Helper to find container of an ID
        const findContainer = (id: string | number) => {
            if (typeof id === 'number') {
                for (const gid in groups) {
                    if (groups[gid].requirementIds.includes(id)) return gid;
                }
                return 'root';
            }
            // If id is string, it must be a groupId (which is in root)
            return 'root';
        };

        const activeContainer = findContainer(activeId);
        let overContainer = findContainer(overId);

        // DISTINCTION: Dropped requirement (number) ONTO a group header (string)
        const isDroppedOnGroupHeader = typeof activeId === 'number' && typeof overId === 'string' && groups[overId];

        if (!activeContainer || !overContainer) return;

        // Case 1: Drop on a group header directly -> Add to end of that group
        if (isDroppedOnGroupHeader) {
            set((state) => {
                const newGroups = { ...state.groups };
                let newListOrder = [...state.listOrder];

                // Remove from old container
                if (activeContainer === 'root') {
                    newListOrder = newListOrder.filter(id => id !== activeId);
                } else {
                    newGroups[activeContainer] = {
                        ...newGroups[activeContainer],
                        requirementIds: newGroups[activeContainer].requirementIds.filter(id => id !== activeId)
                    };
                }

                // Add to the end of the target group
                newGroups[overId] = {
                    ...newGroups[overId],
                    requirementIds: [...newGroups[overId].requirementIds, activeId as number]
                };

                return { groups: newGroups, listOrder: newListOrder };
            });

            // Sync everything
            const { listOrder: updatedOrder, groups: updatedGroups } = get();
            get().syncSettings({ list_order: updatedOrder });

            supabase.auth.getSession().then(({ data: { session } }) => {
                if (session) {
                    if (activeContainer !== 'root') {
                        supabase.from('user_groups').update({ requirement_ids: updatedGroups[activeContainer].requirementIds }).eq('id', activeContainer).eq('user_id', session.user.id);
                    }
                    supabase.from('user_groups').update({ requirement_ids: updatedGroups[overId as string].requirementIds }).eq('id', overId).eq('user_id', session.user.id);
                }
            });
            return;
        }

        // Case 2: Same container (sorting)
        if (activeContainer === overContainer) {
            if (activeContainer === 'root') {
                get().reorderList(listOrder.indexOf(activeId), listOrder.indexOf(overId));
            } else {
                set((state) => {
                    const group = state.groups[activeContainer];
                    const newIds = [...group.requirementIds];
                    const oldIdx = newIds.indexOf(activeId as number);
                    const newIdx = newIds.indexOf(overId as number);
                    const [item] = newIds.splice(oldIdx, 1);
                    newIds.splice(newIdx, 0, item);

                    return {
                        groups: {
                            ...state.groups,
                            [activeContainer]: { ...group, requirementIds: newIds }
                        }
                    };
                });
                // Sync group
                const { groups: updatedGroups } = get();
                const updatedGroup = updatedGroups[activeContainer];
                supabase.auth.getSession().then(({ data: { session } }) => {
                    if (session) {
                        supabase.from('user_groups').update({ requirement_ids: updatedGroup.requirementIds }).eq('id', activeContainer).eq('user_id', session.user.id);
                    }
                });
            }
        }
        // Case 3: Move between containers (Requirement A over Requirement B)
        else {
            if (typeof activeId === 'string') return; // Groups must stay in root

            set((state) => {
                const newGroups = { ...state.groups };
                let newListOrder = [...state.listOrder];

                // Remove from old container
                if (activeContainer === 'root') {
                    newListOrder = newListOrder.filter(id => id !== activeId);
                } else {
                    newGroups[activeContainer] = {
                        ...newGroups[activeContainer],
                        requirementIds: newGroups[activeContainer].requirementIds.filter(id => id !== activeId)
                    };
                }

                // Add to new container
                if (overContainer === 'root') {
                    const overIdx = newListOrder.indexOf(overId);
                    newListOrder.splice(overIdx, 0, activeId);
                } else {
                    const overIdx = newGroups[overContainer].requirementIds.indexOf(overId as number);
                    newGroups[overContainer] = {
                        ...newGroups[overContainer],
                        requirementIds: [
                            ...newGroups[overContainer].requirementIds.slice(0, overIdx),
                            activeId as number,
                            ...newGroups[overContainer].requirementIds.slice(overIdx)
                        ]
                    };
                }

                return { groups: newGroups, listOrder: newListOrder };
            });

            // Sync everything
            const { listOrder: updatedOrder, groups: updatedGroups } = get();
            get().syncSettings({ list_order: updatedOrder });

            supabase.auth.getSession().then(({ data: { session } }) => {
                if (session) {
                    if (activeContainer !== 'root') {
                        supabase.from('user_groups').update({ requirement_ids: updatedGroups[activeContainer].requirementIds }).eq('id', activeContainer).eq('user_id', session.user.id);
                    }
                    if (overContainer !== 'root') {
                        supabase.from('user_groups').update({ requirement_ids: updatedGroups[overContainer].requirementIds }).eq('id', overContainer).eq('user_id', session.user.id);
                    }
                }
            });
        }
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

    updateMediaChapters: async (reqId, mediaId, chapters) => {
        set((state) => {
            const currentState = state.userState[reqId];
            if (!currentState) return state;

            const media = (currentState.media || []).map(m =>
                m.id === mediaId ? { ...m, chapters } : m
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
            await supabase.from('user_media').update({ chapters }).eq('id', mediaId).eq('user_id', session.user.id);
        }
    },

    addMedia: async (reqId, type, title, url, folderId, notes = '', chapters = '') => {
        const tempId = uuidv4();
        const { userState } = get();
        const currentState = userState[reqId] || { reqId, status: 'todo', notes: '', media: [], folders: [] };

        // Calculate next display order
        const maxOrder = Math.max(0, ...currentState.media.map(m => m.displayOrder || 0));
        const newOrder = maxOrder + 1;

        set((state) => {
            const currentState = state.userState[reqId] || { reqId, status: 'todo', notes: '', media: [], folders: [] };
            const currentMedia = currentState.media || [];
            return {
                userState: {
                    ...state.userState,
                    [reqId]: {
                        ...currentState,
                        media: [...currentMedia, { id: tempId, type, title, url, notes, chapters, folderId, displayOrder: newOrder }]
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
                notes,
                chapters,
                folder_id: folderId || null,
                display_order: newOrder
            });

            if (error) {
                console.error('Failed to add media:', error);
            }
        }
    },

    updateMedia: async (reqId, mediaId, data) => {
        set((state) => {
            const currentState = state.userState[reqId];
            if (!currentState) return state;

            const media = (currentState.media || []).map(m =>
                m.id === mediaId ? { ...m, ...data } : m
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
            const updatePayload: any = {};
            if (data.title !== undefined) updatePayload.title = data.title;
            if (data.url !== undefined) updatePayload.url = data.url;
            if (data.notes !== undefined) updatePayload.notes = data.notes;
            if (data.chapters !== undefined) updatePayload.chapters = (data as any).chapters;
            if (data.folderId !== undefined) updatePayload.folder_id = data.folderId || null;

            const { error } = await supabase.from('user_media').update(updatePayload).eq('id', mediaId).eq('user_id', session.user.id);
            if (error) {
                console.error('Failed to update media:', error);
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

    reorderMedia: async (reqId, activeId, overId, folderId) => {
        const { userState } = get();
        const currentState = userState[reqId];
        if (!currentState) return;

        const mediaList = [...currentState.media];
        const oldIndex = mediaList.findIndex(m => m.id === activeId);
        const newIndex = mediaList.findIndex(m => m.id === overId);

        if (oldIndex === -1 || newIndex === -1) return;

        const [movedItem] = mediaList.splice(oldIndex, 1);
        mediaList.splice(newIndex, 0, movedItem);

        // Update displayOrder for all items in this context
        const updatedMedia = mediaList.map((m, index) => ({
            ...m,
            displayOrder: index
        }));

        set((state) => ({
            userState: {
                ...state.userState,
                [reqId]: {
                    ...state.userState[reqId],
                    media: updatedMedia
                }
            }
        }));

        // Persistence
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            // Update all orders in parallel
            await Promise.all(updatedMedia.map(m =>
                supabase.from('user_media').update({ display_order: m.displayOrder }).eq('id', m.id).eq('user_id', session.user.id)
            ));
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

    exportData: () => {
        const { userState, groups, listOrder } = get();

        // We only export things that the user created
        const exportObj = {
            version: '1.0',
            exportedAt: new Date().toISOString(),
            userState,
            groups,
            listOrder
        };

        return JSON.stringify(exportObj, null, 2);
    },

    importData: async (jsonData) => {
        try {
            const importObj = JSON.parse(jsonData);
            const { userState: importedState, groups: importedGroups, listOrder: importedListOrder } = importObj;

            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('No session');
            const userId = session.user.id;

            // ID Mapping to avoid conflicts
            const folderIdMap: Record<string, string> = {};
            const groupIdMap: Record<string, string> = {};

            // 1. Prepare Folders and Media with new IDs
            const newFolders: any[] = [];
            const newMedia: any[] = [];
            const newProgress: any[] = [];

            for (const reqIdStr in importedState) {
                const reqId = parseInt(reqIdStr);
                const state = importedState[reqIdStr];

                // Progress
                newProgress.push({
                    user_id: userId,
                    requirement_id: reqId,
                    status: 'todo', // We reset status per user request, but keep notes
                    notes: state.notes || ''
                });

                // Folders
                state.folders?.forEach((f: any) => {
                    const newId = uuidv4();
                    folderIdMap[f.id] = newId;
                    newFolders.push({
                        id: newId,
                        user_id: userId,
                        requirement_id: reqId,
                        name: f.name
                    });
                });

                // Media
                state.media?.forEach((m: any) => {
                    newMedia.push({
                        id: uuidv4(),
                        user_id: userId,
                        requirement_id: reqId,
                        type: m.type,
                        title: m.title,
                        url: m.url,
                        notes: m.notes || null,
                        folder_id: m.folderId ? folderIdMap[m.folderId] : null,
                        display_order: m.displayOrder || 0
                    });
                });
            }

            // 2. Prepare Groups with new IDs
            const newGroups: any[] = [];
            for (const gid in importedGroups) {
                const group = importedGroups[gid];
                const newId = uuidv4();
                groupIdMap[gid] = newId;
                newGroups.push({
                    id: newId,
                    user_id: userId,
                    name: group.name,
                    requirement_ids: group.requirementIds,
                    collapsed: group.collapsed || false
                });
            }

            // 3. Batch insert to Supabase
            if (newProgress.length > 0) await supabase.from('user_progress').upsert(newProgress);
            if (newFolders.length > 0) await supabase.from('user_folders').insert(newFolders);
            if (newMedia.length > 0) await supabase.from('user_media').insert(newMedia);
            if (newGroups.length > 0) await supabase.from('user_groups').insert(newGroups);

            // 4. Update List Order
            const newListOrder = importedListOrder.map((id: any) => {
                if (typeof id === 'string' && groupIdMap[id]) return groupIdMap[id];
                return id;
            });
            await get().syncSettings({ list_order: newListOrder });

            // 5. Reload Store
            await get().init();

        } catch (e) {
            console.error('Import failed:', e);
            throw e;
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
