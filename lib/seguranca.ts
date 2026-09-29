import { createHash, timingSafeEqual } from "crypto";
import { emailValido } from "@/app/utils/usuarioCadastro";

export const SENHA_MIN_PADRINHO = 8;
export const SENHA_MIN_ADMIN = 8;
export const SENHA_MAX = 128;

export const LIMITE_NOME = 100;
export const LIMITE_EMAIL = 100;

export function sha256Hex(valor: string) {
  return createHash("sha256").update(valor).digest("hex");
}

// Compara em tempo constante (hash antes, pra os buffers terem sempre o mesmo tamanho).
export function textosIguais(a: string, b: string) {
  return timingSafeEqual(createHash("sha256").update(a).digest(), createHash("sha256").update(b).digest());
}

const SENHAS_COMUNS = new Set([
  "12345678", "123456789", "1234567890", "12345678910", "123123123", "1234512345",
  "87654321", "11111111", "00000000", "abcd1234", "abc12345", "qwertyui", "qwertyuiop",
  "qwerty123", "asdfghjk", "asdfghjkl", "password", "password1", "password123", "senha123",
  "senha1234", "senha12345", "minhasenha", "mudar123", "mudar1234", "admin123", "admin1234",
  "administrador", "natal2024", "natal2025", "natal2026", "natal123", "natal1234",
  "cartinhas", "cartinha123", "semprecrianca", "iloveyou", "brasil123", "corinthians",
  "flamengo123", "123mudar", "trocar123",
]);

export function validarPoliticaSenha(
  senha: string,
  opcoes: { min: number; email?: string },
): string | null {
  if (senha.length < opcoes.min) {
    return `A senha deve ter pelo menos ${opcoes.min} caracteres.`;
  }
  if (senha.length > SENHA_MAX) {
    return `A senha deve ter no máximo ${SENHA_MAX} caracteres.`;
  }
  const normalizada = senha.toLowerCase();
  if (SENHAS_COMUNS.has(normalizada) || /^(.)\1+$/.test(senha)) {
    return "Essa senha é muito comum. Escolha outra mais difícil de adivinhar.";
  }
  if (opcoes.email && normalizada === opcoes.email.trim().toLowerCase()) {
    return "A senha não pode ser igual ao e-mail.";
  }
  return null;
}

export function minimoSenhaPorTipo(tipo: "admin" | "padrinho") {
  return tipo === "admin" ? SENHA_MIN_ADMIN : SENHA_MIN_PADRINHO;
}

export function validarDadosUsuario(dados: {
  nome: string;
  telefone: string;
  email: string;
}): string | null {
  if (!dados.nome || !dados.telefone || !dados.email) {
    return "Nome, telefone e e-mail são obrigatórios.";
  }
  if (dados.nome.length > LIMITE_NOME) {
    return `O nome deve ter no máximo ${LIMITE_NOME} caracteres.`;
  }
  if (dados.email.length > LIMITE_EMAIL || !emailValido(dados.email)) {
    return "Informe um e-mail válido.";
  }
  const digitos = dados.telefone.replace(/\D/g, "");
  if (dados.telefone.length > 20 || digitos.length < 10 || digitos.length > 11) {
    return "Informe um telefone válido com DDD.";
  }
  return null;
}

// Ids vindos do cliente (argumentos de Server Action podem ser adulterados).
export function idsValidos(ids: unknown, max: number): number[] | null {
  if (!Array.isArray(ids) || ids.length === 0 || ids.length > max) return null;
  const limpos = ids.map((id) => Number(id));
  if (!limpos.every((id) => Number.isSafeInteger(id) && id > 0)) return null;
  return Array.from(new Set(limpos));
}

export function idValido(valor: unknown): number | null {
  const n = Number(valor);
  return Number.isSafeInteger(n) && n > 0 ? n : null;
}
