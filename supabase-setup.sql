-- Tabela de técnicas (status manual para fundamentos)
CREATE TABLE tecnicas (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  categoria TEXT NOT NULL,
  qtd_exigida TEXT, -- pode ser número, 'TODOS', ou null
  observacoes TEXT DEFAULT '',
  status_manual TEXT DEFAULT 'nao_sei',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de variações
CREATE TABLE variacoes (
  id TEXT PRIMARY KEY,
  tecnica_id TEXT NOT NULL REFERENCES tecnicas(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'nao_sei',
  observacoes TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de conteúdos
CREATE TABLE conteudos (
  id TEXT PRIMARY KEY,
  tecnica_id TEXT REFERENCES tecnicas(id) ON DELETE CASCADE,
  variacao_id TEXT REFERENCES variacoes(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  plataforma TEXT NOT NULL,
  tipo TEXT NOT NULL,
  observacoes TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE tecnicas ENABLE ROW LEVEL SECURITY;
ALTER TABLE variacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE conteudos ENABLE ROW LEVEL SECURITY;

-- Policies para acesso público (sem autenticação)
CREATE POLICY "Allow all access to tecnicas" ON tecnicas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to variacoes" ON variacoes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to conteudos" ON conteudos FOR ALL USING (true) WITH CHECK (true);

-- Inserir técnicas do exame
INSERT INTO tecnicas (id, nome, categoria, qtd_exigida) VALUES
('1', 'Histórico – Atualidades – Regras e Pontuações', 'Fundamento', NULL),
('2', 'Defesa Pessoal', 'Defesa', '2'),
('3', 'Rolamentos e Fuga de Quadril', 'Fundamento', 'TODOS'),
('4', 'Quedas com Nome', 'Fundamento', '2'),
('5', 'Raspagem Guarda Fechada', 'Raspagem', '2'),
('6', 'Raspagem Meia Guarda', 'Raspagem', '2'),
('7', 'Raspagem com Gancho de la Riva', 'Raspagem', '1'),
('8', 'Raspagem Guarda-Aberta (Aranha, Laçada, Lapela, etc.)', 'Raspagem', '1'),
('9', 'Arm-Lock na Guarda', 'Finalização', '2'),
('10', 'Arm-Lock Partindo da Montada', 'Finalização', '1'),
('11', 'Defesa do Arm-Lock na Guarda', 'Defesa', '1'),
('12', 'Triângulo', 'Finalização', '1'),
('13', 'Defesa Triângulo', 'Defesa', '1'),
('14', 'Mata-Leão', 'Finalização', '1'),
('15', 'Defesa Mata-Leão', 'Defesa', '1'),
('16', 'Americana', 'Finalização', '1'),
('17', 'Kimura', 'Finalização', '1'),
('18', 'Relógio', 'Finalização', '2'),
('19', 'Omoplata', 'Finalização', '1'),
('20', 'Defesa Omoplata', 'Defesa', '1'),
('21', 'Estrangulamento (costas, guarda, montada, 100kg, lapela)', 'Finalização', '2'),
('22', 'Chave de Pé (reta)', 'Finalização', '1'),
('23', 'Defesa Chave de Pé (reta)', 'Defesa', '1'),
('24', 'Mão de Vaca', 'Finalização', '2'),
('25', 'Passagem de Guarda saindo da Guarda Fechada', 'Passagem', '1'),
('26', 'Passagem de Guarda Aberta', 'Passagem', '1'),
('27', 'Passagem de Guarda partindo da Meia Guarda', 'Passagem', '1'),
('28', 'Técnicas para Chegar à Montada', 'Passagem', '2'),
('29', 'Saída Montada', 'Saída', '1'),
('30', 'Saída Cem Quilos', 'Saída', '1'),
('31', 'Saída Joelho na Barriga', 'Saída', '1'),
('32', 'Saída Pegada pelas Costas', 'Saída', '1'),
('33', 'Saída Norte-Sul', 'Saída', '1');
