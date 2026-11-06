-- LGPD: registro do aceite da Política de Privacidade.
--
-- ORDEM PARA SUBIR (importante):
--   1. Faça backup do banco.
--   2. Aplique este arquivo no banco de PRODUÇÃO.
--   3. Só depois faça o deploy do código novo.
-- O código novo lê e grava estas colunas (login, cadastro, tela de aceite). Se subir antes
-- da migration, o site inteiro falha: getUsuarioAutenticado() seleciona politica_versao.
-- Aplicar a migration antes é seguro: o código antigo simplesmente ignora as colunas.
--
-- politica_aceita_em: data/hora do aceite.
-- politica_versao: versão da Política aceita (ex.: '1.0'). Permite pedir novo aceite quando
--   o texto mudar. NULL = nunca aceitou; verá a tela de aceite no próximo acesso.
-- Quem já está cadastrado fica com NULL nas duas colunas e vê a tela de aceite ao entrar.

ALTER TABLE usuarios
  ADD COLUMN politica_aceita_em DATETIME NULL,
  ADD COLUMN politica_versao VARCHAR(20) NULL;
