'use client';

import { useState, useEffect, useCallback } from 'react';
import { ExamData, Tecnica, Variacao, Conteudo, TecnicaComStatus, Status } from '@/types';
import { examRequirements } from '@/data/examRequirements';

const STORAGE_KEY = 'jj-exam-data';

const initialData: ExamData = {
    tecnicas: examRequirements,
    variacoes: [],
    conteudos: [],
};

export function useExamData() {
    const [data, setData] = useState<ExamData>(initialData);
    const [isLoaded, setIsLoaded] = useState(false);

    // Carregar dados do localStorage
    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                const parsed = JSON.parse(stored) as ExamData;
                // Merge com técnicas do exame (caso adicionem novas)
                const tecnicaIds = new Set(parsed.tecnicas.map(t => t.id));
                const newTecnicas = examRequirements.filter(t => !tecnicaIds.has(t.id));
                setData({
                    ...parsed,
                    tecnicas: [...parsed.tecnicas, ...newTecnicas],
                });
            } catch {
                setData(initialData);
            }
        }
        setIsLoaded(true);
    }, []);

    // Salvar no localStorage
    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        }
    }, [data, isLoaded]);

    // Calcular status de uma técnica
    const calcularStatusTecnica = useCallback((tecnica: Tecnica): TecnicaComStatus => {
        const variacoes = data.variacoes.filter(v => v.tecnicaId === tecnica.id);
        const variacoesDominadas = variacoes.filter(v => v.status === 'dominada').length;
        const variacoesAprendendo = variacoes.filter(v => v.status === 'aprendendo').length;
        const totalVariacoes = variacoes.length;

        let status: Status;

        if (tecnica.qtdExigida === null) {
            // Fundamento teórico - status manual
            status = tecnica.statusManual || 'nao_sei';
        } else if (tecnica.qtdExigida === 'TODOS') {
            // Precisa dominar todas as variações
            if (totalVariacoes === 0) {
                status = 'nao_sei';
            } else if (variacoesDominadas === totalVariacoes) {
                status = 'dominada';
            } else if (variacoesDominadas > 0 || variacoesAprendendo > 0) {
                status = 'aprendendo';
            } else {
                status = 'nao_sei';
            }
        } else {
            // Precisa dominar X variações
            if (variacoesDominadas >= tecnica.qtdExigida) {
                status = 'dominada';
            } else if (variacoesDominadas > 0 || variacoesAprendendo > 0) {
                status = 'aprendendo';
            } else {
                status = 'nao_sei';
            }
        }

        return {
            ...tecnica,
            status,
            variacoesDominadas,
            totalVariacoes,
        };
    }, [data.variacoes]);

    // Obter todas as técnicas com status calculado
    const getTecnicasComStatus = useCallback((): TecnicaComStatus[] => {
        return data.tecnicas.map(calcularStatusTecnica);
    }, [data.tecnicas, calcularStatusTecnica]);

    // Obter uma técnica específica
    const getTecnica = useCallback((id: string): TecnicaComStatus | undefined => {
        const tecnica = data.tecnicas.find(t => t.id === id);
        return tecnica ? calcularStatusTecnica(tecnica) : undefined;
    }, [data.tecnicas, calcularStatusTecnica]);

    // Obter variações de uma técnica
    const getVariacoes = useCallback((tecnicaId: string): Variacao[] => {
        return data.variacoes.filter(v => v.tecnicaId === tecnicaId);
    }, [data.variacoes]);

    // Obter conteúdos de uma técnica ou variação
    const getConteudos = useCallback((tecnicaId?: string, variacaoId?: string): Conteudo[] => {
        return data.conteudos.filter(c => {
            if (variacaoId) return c.variacaoId === variacaoId;
            if (tecnicaId) return c.tecnicaId === tecnicaId && !c.variacaoId;
            return false;
        });
    }, [data.conteudos]);

    // Adicionar variação
    const addVariacao = useCallback((variacao: Omit<Variacao, 'id'>) => {
        const newVariacao: Variacao = {
            ...variacao,
            id: Date.now().toString(),
        };
        setData(prev => ({
            ...prev,
            variacoes: [...prev.variacoes, newVariacao],
        }));
    }, []);

    // Atualizar variação
    const updateVariacao = useCallback((id: string, updates: Partial<Variacao>) => {
        setData(prev => ({
            ...prev,
            variacoes: prev.variacoes.map(v => v.id === id ? { ...v, ...updates } : v),
        }));
    }, []);

    // Remover variação
    const removeVariacao = useCallback((id: string) => {
        setData(prev => ({
            ...prev,
            variacoes: prev.variacoes.filter(v => v.id !== id),
            conteudos: prev.conteudos.filter(c => c.variacaoId !== id),
        }));
    }, []);

    // Atualizar status manual de técnica (para Fundamento)
    const updateTecnicaStatusManual = useCallback((id: string, status: Status) => {
        setData(prev => ({
            ...prev,
            tecnicas: prev.tecnicas.map(t => t.id === id ? { ...t, statusManual: status } : t),
        }));
    }, []);

    // Atualizar observações da técnica
    const updateTecnicaObservacoes = useCallback((id: string, observacoes: string) => {
        setData(prev => ({
            ...prev,
            tecnicas: prev.tecnicas.map(t => t.id === id ? { ...t, observacoes } : t),
        }));
    }, []);

    // Adicionar conteúdo
    const addConteudo = useCallback((conteudo: Omit<Conteudo, 'id'>) => {
        const newConteudo: Conteudo = {
            ...conteudo,
            id: Date.now().toString(),
        };
        setData(prev => ({
            ...prev,
            conteudos: [...prev.conteudos, newConteudo],
        }));
    }, []);

    // Remover conteúdo
    const removeConteudo = useCallback((id: string) => {
        setData(prev => ({
            ...prev,
            conteudos: prev.conteudos.filter(c => c.id !== id),
        }));
    }, []);

    // Calcular progresso geral
    const getProgressoGeral = useCallback(() => {
        const tecnicas = getTecnicasComStatus();
        const total = tecnicas.length;
        const dominadas = tecnicas.filter(t => t.status === 'dominada').length;
        const aprendendo = tecnicas.filter(t => t.status === 'aprendendo').length;
        return {
            total,
            dominadas,
            aprendendo,
            pendentes: total - dominadas - aprendendo,
            percentual: Math.round((dominadas / total) * 100),
        };
    }, [getTecnicasComStatus]);

    // Exportar dados
    const exportData = useCallback(() => {
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `jj-exam-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }, [data]);

    // Importar dados
    const importData = useCallback((jsonString: string) => {
        try {
            const imported = JSON.parse(jsonString) as ExamData;
            if (imported.tecnicas && imported.variacoes && imported.conteudos) {
                setData(imported);
                return true;
            }
            return false;
        } catch {
            return false;
        }
    }, []);

    return {
        isLoaded,
        getTecnicasComStatus,
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
        getProgressoGeral,
        exportData,
        importData,
    };
}
