export type RequirementCategory =
    | 'Geral'
    | 'Defesa Pessoal'
    | 'Queda'
    | 'Raspagem'
    | 'Finalização'
    | 'Defesa'
    | 'Passagem'
    | 'Saída';

export interface ExamRequirement {
    id: number;
    order: number;
    name: string;
    qtd: string | number; // '-' | 'TODOS' | number
    category: RequirementCategory;
}

export type LearningStatus = 'todo' | 'learning' | 'done';

export interface MediaItem {
    id: string;
    type: 'video' | 'link';
    title: string;
    url: string;
    notes?: string;
    folderId?: string;
}

export interface MediaFolder {
    id: string;
    name: string;
}

export interface UserRequirementState {
    reqId: number;
    status: LearningStatus;
    notes: string;
    media: MediaItem[];
    folders: MediaFolder[];
}

export interface UserGroup {
    id: string;
    name: string;
    requirementIds: number[]; // Ordered list of Requirement IDs in this group
    collapsed: boolean;
    color?: string;
}

// The complete state shape for the application
export interface ExamState {
    requirements: ExamRequirement[]; // Static data
    userState: Record<number, UserRequirementState>; // Map reqId -> State
    groups: UserGroup[]; // Ordered list of groups (some might be implicit/default?)
    // Actually, we need a way to represent the "List Order".
    // The list can contain: "Items" (loose) and "Groups" (containing items).
    // Let's use a "ListStructure" approach.
    rootOrder: (number | string)[]; // Array of reqId (number) or groupId (string)

    // Selection State
    selectedIds: number[]; // Array of selected Requirement IDs
    lastSelectedId: number | null; // For Shift+Click logic
}
