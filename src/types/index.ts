// Tipos principais do sistema

export type Categoria = 'Raspagem' | 'Finalização' | 'Defesa' | 'Passagem' | 'Saída' | 'Fundamento';

export type Status = 'nao_sei' | 'aprendendo' | 'dominada';

export type Plataforma = 'youtube' | 'tiktok' | 'instagram' | 'outro';

export type TipoConteudo = 'didatico' | 'ajuste_fino' | 'variacao';

// Técnica - status é DERIVADO das variações
export interface Tecnica {
  id: string;
  nome: string;
  categoria: Categoria;
  qtdExigida: number | 'TODOS' | null; // null = teórica, TODOS = todas variações
  observacoes: string;
  // Para Fundamento com qtdExigida = null, status é manual
  statusManual?: Status;
}

// Variação - única forma de marcar progresso prático
export interface Variacao {
  id: string;
  tecnicaId: string;
  nome: string;
  status: Status;
  observacoes: string;
}

// Conteúdo - pode pertencer a técnica, variação OU grupo
export interface Conteudo {
  id: string;
  tecnicaId?: string;
  variacaoId?: string;
  grupoId?: string; // Novo: para sistema de grupos
  titulo?: string; // Nome/título do conteúdo (ex: "Queda Osoto Gari")
  url: string;
  plataforma: Plataforma;
  tipo: TipoConteudo;
  observacoes: string;
}

// Estado completo do sistema
export interface ExamData {
  tecnicas: Tecnica[];
  variacoes: Variacao[];
  conteudos: Conteudo[];
}

// Status calculado de uma técnica
export interface TecnicaComStatus extends Tecnica {
  status: Status;
  variacoesDominadas: number;
  totalVariacoes: number;
}

// ===== SISTEMA DE MODELOS DE REQUISITOS =====

export interface Requisito {
  id: number;
  nome: string;
  qtd: string | number;
  cor?: string; // Cor personalizada da linha
  grupo?: string; // ID do grupo ao qual pertence
}

export interface GrupoRequisitos {
  id: string;
  nome: string;
  cor?: string;
  requisitosIds: number[]; // IDs dos requisitos neste grupo
}

export interface ModeloRequisitos {
  id: string;
  nome: string;
  tipo: 'original' | 'personalizado';
  requisitos: Requisito[];
  grupos: GrupoRequisitos[];
  criadoEm: string;
  modificadoEm: string;
}
