-- Adiciona snapshot do padrinho em cartinhas entregues, pra que a autoria da
-- entrega sobreviva à exclusão de conta (LGPD) — mesmo padrão já usado em
-- desistencias (migration_v10.sql).
--
-- Sem isso, excluirConta() precisaria escolher entre duas coisas ruins: manter
-- o vínculo apadrinhado_por_usuario_id apontando pra um usuário que vai ser
-- apagado (a FK é ON DELETE RESTRICT, então a exclusão falharia pra qualquer
-- padrinho com cartinha entregue), ou zerar o vínculo de toda cartinha —
-- inclusive as entregues, perdendo o registro de quem entregou.
--
-- Não precisa mexer na FK (diferente da v10): excluirConta() já zera
-- apadrinhado_por_usuario_id de toda cartinha antes de apagar o usuário, então
-- a FK nunca chega a barrar o DELETE. Só falta o snapshot pra a informação não
-- sumir junto com o vínculo.

ALTER TABLE cartinhas
  ADD COLUMN nome_padrinho VARCHAR(100) NULL AFTER apadrinhado_por_usuario_id,
  ADD COLUMN email_padrinho VARCHAR(100) NULL AFTER nome_padrinho;
