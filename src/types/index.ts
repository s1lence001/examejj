// Tipos principais do sistema

export type Categoria = 'Raspagem' | 'Finalização' | 'Defesa' | 'Passagem' | 'Saída' | 'Fundamento';

export type Status = 'nao_sei' | 'aprendendo' | 'dominada';

export type Plataforma = 'youtube' | 'tiktok';

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

// Conteúdo - pode pertencer a técnica OU variação
export interface Conteudo {
  id: string;
  tecnicaId?: string;
  variacaoId?: string;
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
