import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import db from "@/lib/db";

export interface UsuarioAutenticado {
  id: number;
  nome: string;
  telefone: string;
  email: string;
  tipo: string;
}

const SESSION_COOKIE = "sistema_natal_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

function getAuthSecret() {
  return process.env.AUTH_SECRET || "sistema-natal-dev-secret";
}

export function gerarHashSenha(senha: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(senha, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function validarSenha(senha: string, hashArmazenado: string) {
  if (!hashArmazenado.includes(":")) {
    return senha === hashArmazenado;
  }

  const [salt, hashOriginal] = hashArmazenado.split(":");
  const hashCalculado = scryptSync(senha, salt, 64);
  const hashBuffer = Buffer.from(hashOriginal, "hex");

  if (hashCalculado.length !== hashBuffer.length) {
    return false;
  }

  return timingSafeEqual(hashCalculado, hashBuffer);
}

function assinarSessao(payload: string) {
  return createHmac("sha256", getAuthSecret()).update(payload).digest("hex");
}

function criarValorSessao(usuarioId: number) {
  const expiresAt = Date.now() + SESSION_MAX_AGE * 1000;
  const nonce = randomBytes(12).toString("hex");
  const payload = `${usuarioId}.${expiresAt}.${nonce}`;
  const assinatura = assinarSessao(payload);
  return `${payload}.${assinatura}`;
}

function lerUsuarioIdDaSessao(valor: string | undefined) {
  if (!valor) {
    return null;
  }

  const partes = valor.split(".");

  if (partes.length !== 4) {
    return null;
  }

  const [usuarioId, expiresAt, nonce, assinatura] = partes;
  const payload = `${usuarioId}.${expiresAt}.${nonce}`;
  const assinaturaEsperada = assinarSessao(payload);

  if (assinatura !== assinaturaEsperada) {
    return null;
  }

  if (Number(expiresAt) < Date.now()) {
    return null;
  }

  const id = Number(usuarioId);
  return Number.isFinite(id) ? id : null;
}

export async function criarSessao(usuarioId: number) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, criarValorSessao(usuarioId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function limparSessao() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getUsuarioAutenticado() {
  const cookieStore = await cookies();
  const valorSessao = cookieStore.get(SESSION_COOKIE)?.value;
  const usuarioId = lerUsuarioIdDaSessao(valorSessao);

  if (!usuarioId) {
    return null;
  }

  const [rows]: any = await db.query(
    "SELECT id, nome, telefone, email, tipo FROM usuarios WHERE id = ? LIMIT 1",
    [usuarioId],
  );

  return (rows?.[0] as UsuarioAutenticado | undefined) || null;
}
