-- =====================================================
-- MIGRAÇÃO: Adicionar autenticação por usuário
-- Execute este SQL no Supabase SQL Editor
-- =====================================================

-- 1. Adicionar coluna user_id às tabelas existentes
ALTER TABLE tecnicas ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE variacoes ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE conteudos ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- 2. Remover dados compartilhados antigos (sem user_id)
-- ATENÇÃO: Isso apaga os dados atuais! 
-- Se quiser manter, comente estas linhas:
DELETE FROM conteudos WHERE user_id IS NULL;
DELETE FROM variacoes WHERE user_id IS NULL;
DELETE FROM tecnicas WHERE user_id IS NULL;

-- 3. Remover políticas antigas
DROP POLICY IF EXISTS "Allow all access to tecnicas" ON tecnicas;
DROP POLICY IF EXISTS "Allow all access to variacoes" ON variacoes;
DROP POLICY IF EXISTS "Allow all access to conteudos" ON conteudos;

-- 4. Criar novas políticas com isolamento por usuário
CREATE POLICY "Users can view their own tecnicas"
  ON tecnicas FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tecnicas"
  ON tecnicas FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tecnicas"
  ON tecnicas FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tecnicas"
  ON tecnicas FOR DELETE
  USING (auth.uid() = user_id);

-- Variações
CREATE POLICY "Users can view their own variacoes"
  ON variacoes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own variacoes"
  ON variacoes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own variacoes"
  ON variacoes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own variacoes"
  ON variacoes FOR DELETE
  USING (auth.uid() = user_id);

-- Conteúdos
CREATE POLICY "Users can view their own conteudos"
  ON conteudos FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own conteudos"
  ON conteudos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conteudos"
  ON conteudos FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own conteudos"
  ON conteudos FOR DELETE
  USING (auth.uid() = user_id);
