-- Segurança: sessões revogáveis no servidor e contador de rate limit.
--
-- APLICAR NO BANCO ANTES DE SUBIR O CÓDIGO NOVO. Sem a tabela `sessoes` ninguém
-- consegue logar. Depois do deploy todos os usuários logados precisam entrar de
-- novo uma vez (o formato do cookie mudou).
--
-- sessoes: guarda só o SHA-256 do token (o token em si só existe no cookie).
-- Logout, troca e redefinição de senha apagam linhas daqui, o que derruba a sessão.

CREATE TABLE IF NOT EXISTS sessoes (
  token_hash CHAR(64) NOT NULL PRIMARY KEY,
  usuario_id INT NOT NULL,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expira_em DATETIME NOT NULL,
  INDEX idx_sessoes_usuario (usuario_id),
  INDEX idx_sessoes_expira (expira_em),
  CONSTRAINT fk_sessoes_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- rate_limit: contador por chave (ex.: "login:ip:1.2.3.4") numa janela fixa.
CREATE TABLE IF NOT EXISTS rate_limit (
  chave VARCHAR(190) NOT NULL PRIMARY KEY,
  contagem INT NOT NULL DEFAULT 0,
  janela_inicio DATETIME NOT NULL,
  INDEX idx_rate_limit_janela (janela_inicio)
);

-- reset_token passa a guardar o SHA-256 (64 hex) do token enviado por e-mail.
-- Links de redefinição pendentes antes desta migration deixam de funcionar.
UPDATE usuarios SET reset_token = NULL, reset_token_expiry = NULL WHERE reset_token IS NOT NULL;
