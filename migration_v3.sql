-- =============================================================
-- MIGRATION V3 — Recuperação de Senha
-- Execute no banco 'sistemanatal' via phpMyAdmin
-- =============================================================

ALTER TABLE usuarios
  ADD COLUMN reset_token VARCHAR(64) NULL,
  ADD COLUMN reset_token_expiry DATETIME NULL;

-- Verificação
-- DESCRIBE usuarios;
