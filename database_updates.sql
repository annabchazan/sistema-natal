-- SQL para atualizar o banco de dados do Sistema Natal
-- Execute estes comandos no seu MySQL para adicionar as novas funcionalidades

-- 1. Adicionar coluna de quantidade de vagas na tabela instituicoes
ALTER TABLE instituicoes ADD COLUMN quantidade_vagas INT DEFAULT 0;

-- 2. Adicionar coluna de número sequencial na tabela cartinhas
ALTER TABLE cartinhas ADD COLUMN numero_sequencial INT;

-- 3. Adicionar coluna de foto da cartinha na tabela cartinhas
-- Se a coluna já existe com nome errado, renomeie:
-- ALTER TABLE cartinhas CHANGE foto_crianca foto_cartinha VARCHAR(255);
-- Se a coluna existe com tamanho insuficiente, ajuste para VARCHAR(500):
-- ALTER TABLE cartinhas MODIFY foto_cartinha VARCHAR(500);
-- Senão, crie nova:
ALTER TABLE cartinhas ADD COLUMN foto_cartinha VARCHAR(500);

-- 4. Adicionar coluna de data limite de entrega na tabela cartinhas
ALTER TABLE cartinhas ADD COLUMN data_limite_entrega DATE;

-- 5. Adicionar coluna de status na tabela cartinhas (para controle de disponibilidade)
ALTER TABLE cartinhas ADD COLUMN status ENUM('disponivel','apadrinhada','conferida','embrulhado','reapadrinhado') DEFAULT 'disponivel';
UPDATE cartinhas SET status = 'disponivel' WHERE status IS NULL;

-- 6. Adicionar coluna de apadrinhamento na tabela cartinhas (opcional, para controle)
ALTER TABLE cartinhas ADD COLUMN apadrinada TINYINT(1) DEFAULT 0;
ALTER TABLE cartinhas ADD COLUMN data_apadrinamento DATETIME NULL;

-- 6. Criar tabela de usuarios para cadastro e login
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    telefone VARCHAR(20) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    tipo ENUM('admin', 'padrinho') DEFAULT 'padrinho'
);

-- Verificar se as colunas foram adicionadas corretamente
-- DESCRIBE instituicoes;
-- DESCRIBE cartinhas;
-- DESCRIBE usuarios;
