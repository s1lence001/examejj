-- Adicionar coluna 'titulo' à tabela 'conteudos'
-- Execute isso no Supabase SQL Editor

ALTER TABLE conteudos ADD COLUMN IF NOT EXISTS titulo TEXT DEFAULT '';
ALTER TABLE conteudos ADD COLUMN IF NOT EXISTS observacoes TEXT DEFAULT '';
