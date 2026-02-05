'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Tecnica, Variacao, Conteudo, TecnicaComStatus, Status, Categoria } from '@/types';
import { examRequirements } from '@/data/examRequirements';

export function useExamData() {
    const { user } = useAuth();
    const [tecnicas, setTecnicas] = useState<Tecnica[]>([]);
    const [variacoes, setVariacoes] = useState<Variacao[]>([]);
    const [conteudos, setConteudos] = useState<Conteudo[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    // Inicializar técnicas para novo usuário
    const initializeTecnicas = useCallback(async (userId: string) => {
        const tecnicasToInsert = examRequirements.map(t => ({
            id: `${userId}-${t.id}`,
            nome: t.nome,
            categoria: t.categoria,
            qtd_exigida: t.qtdExigida === null ? null : String(t.qtdExigida),
            observacoes: '',
            status_manual: 'nao_sei',
            user_id: userId,
        }));

        await supabase.from('tecnicas').insert(tecnicasToInsert);
        return tecnicasToInsert;
    }, []);

    // Carregar dados do Supabase
    useEffect(() => {
        if (!user) {
            setIsLoaded(true);
            return;
        }

        const userId = user.id;

        async function loadData() {
            try {
                // Buscar técnicas do usuário
                let { data: tecnicasData } = await supabase
                    .from('tecnicas')
                    .select('*')
                    .eq('user_id', userId)
                    .order('id');

                // Se não tem técnicas, inicializar
                if (!tecnicasData || tecnicasData.length === 0) {
                    await initializeTecnicas(userId);
                    const { data: newTecnicas } = await supabase
                        .from('tecnicas')
                        .select('*')
                        .eq('user_id', userId)
                        .order('id');
                    tecnicasData = newTecnicas;
                }

                const [variacoesRes, conteudosRes] = await Promise.all([
                    supabase.from('variacoes').select('*').eq('user_id', userId),
                    supabase.from('conteudos').select('*').eq('user_id', userId),
                ]);

                if (tecnicasData) {
                    setTecnicas(tecnicasData.map(t => ({
                        id: t.id,
                        nome: t.nome,
                        categoria: t.categoria as Categoria,
                        qtdExigida: t.qtd_exigida === null ? null : (t.qtd_exigida === 'TODOS' ? 'TODOS' : parseInt(t.qtd_exigida)),
                        observacoes: t.observacoes || '',
                        statusManual: (t.status_manual || 'nao_sei') as Status,
                    })));
                }

                if (variacoesRes.data) {
                    setVariacoes(variacoesRes.data.map(v => ({
                        id: v.id,
                        tecnicaId: v.tecnica_id,
                        nome: v.nome,
                        status: v.status as Status,
                        observacoes: v.observacoes || '',
                    })));
                }

                if (conteudosRes.data) {
                    setConteudos(conteudosRes.data.map(c => ({
                        id: c.id,
                        tecnicaId: c.tecnica_id,
                        variacaoId: c.variacao_id,
                        url: c.url,
                        plataforma: c.plataforma as 'youtube' | 'tiktok',
                        tipo: c.tipo as 'didatico' | 'ajuste_fino' | 'variacao',
                        observacoes: c.observacoes || '',
                    })));
                }
            } catch (error) {
                console.error('Erro ao carregar dados:', error);
            } finally {
                setIsLoaded(true);
            }
        }

        loadData();
    }, [user, initializeTecnicas]);


    // Calcular status de uma técnica
    const calcularStatusTecnica = useCallback((tecnica: Tecnica): TecnicaComStatus => {
        const vars = variacoes.filter(v => v.tecnicaId === tecnica.id);
        const variacoesDominadas = vars.filter(v => v.status === 'dominada').length;
        const variacoesAprendendo = vars.filter(v => v.status === 'aprendendo').length;
        const totalVariacoes = vars.length;

        let status: Status;

        if (tecnica.qtdExigida === null) {
            status = tecnica.statusManual || 'nao_sei';
        } else if (tecnica.qtdExigida === 'TODOS') {
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
            if (variacoesDominadas >= tecnica.qtdExigida) {
                status = 'dominada';
            } else if (variacoesDominadas > 0 || variacoesAprendendo > 0) {
                status = 'aprendendo';
            } else {
                status = 'nao_sei';
            }
        }

        return { ...tecnica, status, variacoesDominadas, totalVariacoes };
    }, [variacoes]);

    const getTecnicasComStatus = useCallback((): TecnicaComStatus[] => {
        return tecnicas.map(calcularStatusTecnica);
    }, [tecnicas, calcularStatusTecnica]);

    const getTecnica = useCallback((id: string): TecnicaComStatus | undefined => {
        const tecnica = tecnicas.find(t => t.id === id);
        return tecnica ? calcularStatusTecnica(tecnica) : undefined;
    }, [tecnicas, calcularStatusTecnica]);

    const getVariacoes = useCallback((tecnicaId: string): Variacao[] => {
        return variacoes.filter(v => v.tecnicaId === tecnicaId);
    }, [variacoes]);

    const getConteudos = useCallback((tecnicaId?: string, variacaoId?: string): Conteudo[] => {
        return conteudos.filter(c => {
            if (variacaoId) return c.variacaoId === variacaoId;
            if (tecnicaId) return c.tecnicaId === tecnicaId && !c.variacaoId;
            return false;
        });
    }, [conteudos]);

    // Adicionar variação
    const addVariacao = useCallback(async (variacao: Omit<Variacao, 'id'>) => {
        if (!user) return;

        const id = Date.now().toString();
        const newVariacao: Variacao = { ...variacao, id };

        setVariacoes(prev => [...prev, newVariacao]);

        await supabase.from('variacoes').insert({
            id,
            tecnica_id: variacao.tecnicaId,
            nome: variacao.nome,
            status: variacao.status,
            observacoes: variacao.observacoes,
            user_id: user.id,
        });
    }, [user]);

    // Atualizar variação
    const updateVariacao = useCallback(async (id: string, updates: Partial<Variacao>) => {
        setVariacoes(prev => prev.map(v => v.id === id ? { ...v, ...updates } : v));

        const dbUpdates: Record<string, unknown> = {};
        if (updates.nome !== undefined) dbUpdates.nome = updates.nome;
        if (updates.status !== undefined) dbUpdates.status = updates.status;
        if (updates.observacoes !== undefined) dbUpdates.observacoes = updates.observacoes;

        await supabase.from('variacoes').update(dbUpdates).eq('id', id);
    }, []);

    // Remover variação
    const removeVariacao = useCallback(async (id: string) => {
        setVariacoes(prev => prev.filter(v => v.id !== id));
        setConteudos(prev => prev.filter(c => c.variacaoId !== id));

        await supabase.from('variacoes').delete().eq('id', id);
    }, []);

    // Atualizar status manual de técnica
    const updateTecnicaStatusManual = useCallback(async (id: string, status: Status) => {
        setTecnicas(prev => prev.map(t => t.id === id ? { ...t, statusManual: status } : t));

        await supabase.from('tecnicas').update({ status_manual: status }).eq('id', id);
    }, []);

    // Atualizar observações da técnica
    const updateTecnicaObservacoes = useCallback(async (id: string, observacoes: string) => {
        setTecnicas(prev => prev.map(t => t.id === id ? { ...t, observacoes } : t));

        await supabase.from('tecnicas').update({ observacoes }).eq('id', id);
    }, []);

    // Adicionar conteúdo
    const addConteudo = useCallback(async (conteudo: Omit<Conteudo, 'id'>) => {
        if (!user) return;

        const id = Date.now().toString();
        const newConteudo: Conteudo = { ...conteudo, id };

        setConteudos(prev => [...prev, newConteudo]);

        await supabase.from('conteudos').insert({
            id,
            tecnica_id: conteudo.tecnicaId || null,
            variacao_id: conteudo.variacaoId || null,
            url: conteudo.url,
            plataforma: conteudo.plataforma,
            tipo: conteudo.tipo,
            observacoes: conteudo.observacoes,
            user_id: user.id,
        });
    }, [user]);

    // Remover conteúdo
    const removeConteudo = useCallback(async (id: string) => {
        setConteudos(prev => prev.filter(c => c.id !== id));

        await supabase.from('conteudos').delete().eq('id', id);
    }, []);

    // Calcular progresso geral
    const getProgressoGeral = useCallback(() => {
        const tecs = getTecnicasComStatus();
        const total = tecs.length;
        const dominadas = tecs.filter(t => t.status === 'dominada').length;
        const aprendendo = tecs.filter(t => t.status === 'aprendendo').length;
        return {
            total,
            dominadas,
            aprendendo,
            pendentes: total - dominadas - aprendendo,
            percentual: total > 0 ? Math.round((dominadas / total) * 100) : 0,
        };
    }, [getTecnicasComStatus]);

    // Exportar dados
    const exportData = useCallback(() => {
        const data = { tecnicas, variacoes, conteudos };
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `jj-exam-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }, [tecnicas, variacoes, conteudos]);

    // Importar dados (placeholder)
    const importData = useCallback((jsonString: string) => {
        console.log('Import requer implementação manual', jsonString);
        return false;
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
