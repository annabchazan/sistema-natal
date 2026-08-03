-- Adiciona snapshot do padrinho em desistencias e torna usuario_id opcional,
-- pra que o histórico de desistência sobreviva à exclusão de conta (LGPD).
--
-- Sem isso, excluirConta() falha com erro de FK pra qualquer padrinho que já
-- tenha uma linha em desistencias, porque a FK usuario_id era ON DELETE RESTRICT
-- (a exclusão de conta tentava DELETE FROM usuarios com a linha de desistencia
-- ainda apontando pra ele, e o banco rejeitava).

ALTER TABLE desistencias
  ADD COLUMN nome_padrinho VARCHAR(100) NULL AFTER usuario_id,
  ADD COLUMN email_padrinho VARCHAR(100) NULL AFTER nome_padrinho;

UPDATE desistencias d
INNER JOIN usuarios u ON u.id = d.usuario_id
SET d.nome_padrinho = u.nome, d.email_padrinho = u.email
WHERE d.nome_padrinho IS NULL;

ALTER TABLE desistencias
  MODIFY COLUMN nome_padrinho VARCHAR(100) NOT NULL,
  MODIFY COLUMN email_padrinho VARCHAR(100) NOT NULL;

ALTER TABLE desistencias
  DROP FOREIGN KEY desistencias_ibfk_2;

ALTER TABLE desistencias
  MODIFY COLUMN usuario_id INT NULL;

ALTER TABLE desistencias
  ADD CONSTRAINT desistencias_ibfk_2 FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL;
