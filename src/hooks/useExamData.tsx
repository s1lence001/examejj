'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Tecnica, Variacao, Conteudo, TecnicaComStatus, Status, Categoria } from '@/types';
import { examRequirements } from '@/data/examRequirements';

interface ExamDataContextType {
    isLoaded: boolean;
    getTecnicasComStatus: () => TecnicaComStatus[];
    getTecnica: (id: string) => TecnicaComStatus | undefined;
    getVariacoes: (tecnicaId: string) => Variacao[];
    getConteudos: (tecnicaId?: string, variacaoId?: string) => Conteudo[];
    addVariacao: (variacao: Omit<Variacao, 'id'>) => void;
    updateVariacao: (id: string, updates: Partial<Variacao>) => void;
    removeVariacao: (id: string) => void;
    updateTecnicaStatusManual: (tecnicaId: string, status: Status) => void;
    updateTecnicaObservacoes: (tecnicaId: string, observacoes: string) => void;
    addConteudo: (conteudo: Omit<Conteudo, 'id'>) => void;
    updateConteudo: (id: string, updates: Partial<Conteudo>) => void;
    removeConteudo: (id: string) => void;
    getProgressoGeral: () => { dominadas: number; aprendendo: number; pendentes: number; total: number; percentual: number };
    exportData: () => void;
    importData: (jsonString: string) => boolean;
}

const ExamDataContext = createContext<ExamDataContextType | null>(null);

export function ExamDataProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const [tecnicas, setTecnicas] = useState<Tecnica[]>([]);
    const [variacoes, setVariacoes] = useState<Variacao[]>([]);
    const [conteudos, setConteudos] = useState<Conteudo[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

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

    // Carregar dados do Supabase - apenas quando user mudar ou primeira vez
    useEffect(() => {
        if (!user) {
            setIsLoaded(true);
            return;
        }

        // Se já carregou para este usuário, não recarrega
        if (hasLoadedOnce && tecnicas.length > 0) {
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
                        status: (v.status || 'nao_sei') as Status,
                        observacoes: v.observacoes || '',
                    })));
                }

                if (conteudosRes.data) {
                    setConteudos(conteudosRes.data.map(c => ({
                        id: c.id,
                        tecnicaId: c.tecnica_id,
                        variacaoId: c.variacao_id,
                        titulo: c.titulo || '',
                        tipo: c.tipo,
                        plataforma: c.plataforma,
                        url: c.url,
                        observacoes: c.observacoes || '',
                    })));
                }

                setHasLoadedOnce(true);
            } catch (error) {
                console.error('Erro ao carregar dados:', error);
            } finally {
                setIsLoaded(true);
            }
        }

        loadData();
    }, [user, initializeTecnicas, hasLoadedOnce, tecnicas.length]);

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
        // Ordenar por categoria (ordem da sidebar) e depois por número do ID
        const categoriaOrder: Categoria[] = [
            'Fundamento',
            'Raspagem',
            'Passagem',
            'Finalização',
            'Defesa',
            'Saída'
        ];

        const ordenadas = [...tecnicas].sort((a, b) => {
            const catIndexA = categoriaOrder.indexOf(a.categoria);
            const catIndexB = categoriaOrder.indexOf(b.categoria);

            if (catIndexA !== catIndexB) {
                return catIndexA - catIndexB;
            }

            // Mesma categoria: ordenar por número do ID
            const numA = parseInt(a.id.split('-').pop() || '0');
            const numB = parseInt(b.id.split('-').pop() || '0');
            return numA - numB;
        });

        return ordenadas.map(calcularStatusTecnica);
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
            return true;
        });
    }, [conteudos]);

    // Mutations with optimistic updates
    const addVariacao = useCallback(async (variacao: Omit<Variacao, 'id'>) => {
        if (!user) return;
        const id = Date.now().toString();
        const newVariacao: Variacao = { ...variacao, id };

        // Optimistic update
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

    const updateVariacao = useCallback(async (id: string, updates: Partial<Variacao>) => {
        // Optimistic update
        setVariacoes(prev => prev.map(v => v.id === id ? { ...v, ...updates } : v));

        const dbUpdates: Record<string, unknown> = {};
        if (updates.nome !== undefined) dbUpdates.nome = updates.nome;
        if (updates.status !== undefined) dbUpdates.status = updates.status;
        if (updates.observacoes !== undefined) dbUpdates.observacoes = updates.observacoes;

        await supabase.from('variacoes').update(dbUpdates).eq('id', id);
    }, []);

    const removeVariacao = useCallback(async (id: string) => {
        // Optimistic update
        setVariacoes(prev => prev.filter(v => v.id !== id));
        setConteudos(prev => prev.filter(c => c.variacaoId !== id));

        await supabase.from('variacoes').delete().eq('id', id);
    }, []);

    const updateTecnicaStatusManual = useCallback(async (tecnicaId: string, status: Status) => {
        // Optimistic update
        setTecnicas(prev => prev.map(t =>
            t.id === tecnicaId ? { ...t, statusManual: status } : t
        ));

        await supabase.from('tecnicas').update({ status_manual: status }).eq('id', tecnicaId);
    }, []);

    const updateTecnicaObservacoes = useCallback(async (tecnicaId: string, observacoes: string) => {
        // Optimistic update
        setTecnicas(prev => prev.map(t =>
            t.id === tecnicaId ? { ...t, observacoes } : t
        ));

        await supabase.from('tecnicas').update({ observacoes }).eq('id', tecnicaId);
    }, []);

    const addConteudo = useCallback(async (conteudo: Omit<Conteudo, 'id'>) => {
        if (!user) return;
        const id = Date.now().toString();
        const newConteudo: Conteudo = { ...conteudo, id };

        // Optimistic update
        setConteudos(prev => [...prev, newConteudo]);

        await supabase.from('conteudos').insert({
            id,
            tecnica_id: conteudo.tecnicaId,
            variacao_id: conteudo.variacaoId,
            titulo: conteudo.titulo || '',
            tipo: conteudo.tipo,
            plataforma: conteudo.plataforma,
            url: conteudo.url,
            observacoes: conteudo.observacoes || '',
            user_id: user.id,
        });
    }, [user]);

    const removeConteudo = useCallback(async (id: string) => {
        // Optimistic update
        setConteudos(prev => prev.filter(c => c.id !== id));

        await supabase.from('conteudos').delete().eq('id', id);
    }, []);

    const updateConteudo = useCallback(async (id: string, updates: Partial<Conteudo>) => {
        // Optimistic update
        setConteudos(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));

        const dbUpdates: Record<string, unknown> = {};
        if (updates.titulo !== undefined) dbUpdates.titulo = updates.titulo;
        if (updates.observacoes !== undefined) dbUpdates.observacoes = updates.observacoes;
        if (updates.url !== undefined) dbUpdates.url = updates.url;
        if (updates.tipo !== undefined) dbUpdates.tipo = updates.tipo;
        if (updates.plataforma !== undefined) dbUpdates.plataforma = updates.plataforma;

        await supabase.from('conteudos').update(dbUpdates).eq('id', id);
    }, []);

    const getProgressoGeral = useCallback(() => {
        const tecnicasComStatus = getTecnicasComStatus();
        const dominadas = tecnicasComStatus.filter(t => t.status === 'dominada').length;
        const aprendendo = tecnicasComStatus.filter(t => t.status === 'aprendendo').length;
        const pendentes = tecnicasComStatus.filter(t => t.status === 'nao_sei').length;
        const total = tecnicasComStatus.length;

        return {
            dominadas,
            aprendendo,
            pendentes,
            total,
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

    return (
        <ExamDataContext.Provider value={{
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
            updateConteudo,
            removeConteudo,
            getProgressoGeral,
            exportData,
            importData,
        }}>
            {children}
        </ExamDataContext.Provider>
    );
}

export function useExamData() {
    const context = useContext(ExamDataContext);
    if (!context) {
        throw new Error('useExamData deve ser usado dentro de ExamDataProvider');
    }
    return context;
}
