-- Adicionar coluna 'notes' à tabela 'user_media'
-- Execute isso no Supabase SQL Editor
ALTER TABLE user_media ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT '';
