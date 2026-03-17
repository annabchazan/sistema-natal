-- SQL para atualizar o banco de dados do Sistema Natal
-- Execute estes comandos no seu MySQL para adicionar as novas funcionalidades

-- 1. Adicionar coluna de quantidade de vagas na tabela instituicoes
ALTER TABLE instituicoes ADD COLUMN quantidade_vagas INT DEFAULT 0;

-- 2. Adicionar coluna de número sequencial na tabela cartinhas
ALTER TABLE cartinhas ADD COLUMN numero_sequencial INT;

-- 3. Adicionar coluna de foto da cartinha na tabela cartinhas
-- Se a coluna já existe com nome errado, renomeie:
-- ALTER TABLE cartinhas CHANGE foto_crianca foto_cartinha VARCHAR(255);
-- Senão, crie nova:
ALTER TABLE cartinhas ADD COLUMN foto_cartinha VARCHAR(255);

-- 4. Adicionar coluna de data limite de entrega na tabela cartinhas
ALTER TABLE cartinhas ADD COLUMN data_limite_entrega DATE;

-- 5. Adicionar coluna de apadrinhamento na tabela cartinhas (opcional, para controle)
ALTER TABLE cartinhas ADD COLUMN apadrinada TINYINT(1) DEFAULT 0;
ALTER TABLE cartinhas ADD COLUMN data_apadrinamento DATETIME NULL;

-- Verificar se as colunas foram adicionadas corretamente
-- DESCRIBE instituicoes;
-- DESCRIBE cartinhas;