import { ModeloRequisitos } from '@/types';

const STORAGE_KEY = 'requisitos_modelos';

export function salvarModelos(modelos: ModeloRequisitos[]): void {
    if (typeof window === 'undefined') return;
    const personalizados = modelos.filter(m => m.tipo === 'personalizado');
    localStorage.setItem(STORAGE_KEY, JSON.stringify(personalizados));
}

export function carregarModelos(): ModeloRequisitos[] {
    if (typeof window === 'undefined') return [];
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        if (!data) return [];
        return JSON.parse(data) as ModeloRequisitos[];
    } catch {
        return [];
    }
}

export function gerarId(): string {
    return `modelo_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}
