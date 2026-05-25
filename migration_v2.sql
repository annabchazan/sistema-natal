-- =============================================================
-- MIGRATION V2 — Sistema Natal
-- Execute este script no banco 'sistemanatal' via phpMyAdmin
-- ou terminal MySQL antes de fazer deploy do novo código
-- =============================================================

-- 1. Corrigir data inválida na cartinha id=6
UPDATE cartinhas
SET data_limite_entrega = NULL
WHERE data_limite_entrega = '0000-00-00';

-- 2. Adicionar coluna data_apadrinamento
--    (estava referenciada no código mas nunca foi aplicada no banco)
ALTER TABLE cartinhas
ADD COLUMN data_apadrinamento DATETIME NULL
AFTER apadrinhado_por_usuario_id;

-- 3. Expandir enum de status com os valores que faltavam
ALTER TABLE cartinhas
MODIFY COLUMN status ENUM(
  'disponivel',
  'apadrinhada',
  'conferida',
  'carente',
  'embrulhado',
  'reapadrinhado',
  'entregue',
  'cancelada'
) DEFAULT 'disponivel';

-- 4. Remover tabela adocoes
--    Razão: não é utilizada pelo código. A lógica de apadrinhamento
--    fica em cartinhas.apadrinhado_por_usuario_id + cartinhas.status.
--    Se no futuro for necessário rastrear ponto de entrega escolhido
--    pelo padrinho, a coluna será adicionada diretamente em cartinhas.
ALTER TABLE adocoes DROP FOREIGN KEY adocoes_ibfk_1;
ALTER TABLE adocoes DROP FOREIGN KEY adocoes_ibfk_2;
ALTER TABLE adocoes DROP FOREIGN KEY adocoes_ibfk_3;
DROP TABLE adocoes;

-- 5. Índice de performance para filtros por status (mais usados)
CREATE INDEX idx_cartinhas_status ON cartinhas(status);

-- 6. Corrigir quantidade_vagas = 0 na instituição id=1 ("Lar das crianças")
--    Com 0 vagas o gerarNumeroSequencial() calcula base errada.
--    Ajuste o valor para a capacidade real da instituição.
UPDATE instituicoes
SET quantidade_vagas = 20
WHERE id = 1 AND quantidade_vagas = 0;

-- =============================================================
-- Verificação final — rode após aplicar
-- =============================================================
-- DESCRIBE cartinhas;
-- SHOW TABLES;
-- SELECT id, nome_crianca, status, data_apadrinamento FROM cartinhas;
