import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import db from "@/lib/db";

export type TipoUsuario = "admin" | "padrinho";
export type AdminRole = "master" | "full" | "editor";

export interface UsuarioAutenticado {
  id: number;
  nome: string;
  telefone: string;
  email: string;
  tipo: TipoUsuario;
  admin_role: AdminRole | null;
}

export const SESSION_COOKIE = "sistema_natal_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7;
function getAuthSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET não está definida. Adicione-a ao .env.local antes de iniciar o servidor.");
  }
  return secret;
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
    "SELECT id, nome, telefone, email, tipo, admin_role FROM usuarios WHERE id = ? LIMIT 1",
    [usuarioId],
  );

  return (rows?.[0] as UsuarioAutenticado | undefined) || null;
}

export function usuarioEhAdmin(usuario: UsuarioAutenticado | null | undefined) {
  return usuario?.tipo === "admin";
}

export function adminPodeCriarOuExcluir(
  usuario: UsuarioAutenticado | null | undefined,
) {
  return (
    usuarioEhAdmin(usuario) &&
    (usuario?.admin_role === "full" || usuario?.admin_role === "master")
  );
}

export function adminPodeEditar(
  usuario: UsuarioAutenticado | null | undefined,
) {
  return usuarioEhAdmin(usuario);
}

export function adminPodeGerenciarPermissoes(
  usuario: UsuarioAutenticado | null | undefined,
) {
  return usuarioEhAdmin(usuario) && usuario?.admin_role === "master";
}

export async function requireUsuarioAutenticado() {
  const usuario = await getUsuarioAutenticado();

  if (!usuario) {
    redirect("/login");
  }

  return usuario;
}

export async function requireAdminAccess() {
  const usuario = await getUsuarioAutenticado();

  if (!usuario) {
    redirect("/login?next=/admin");
  }

  if (!usuarioEhAdmin(usuario)) {
    redirect("/usuario");
  }

  return usuario;
}

export async function validarPermissaoAdmin(
  permissao: "edit" | "manage" | "users",
): Promise<{ ok: true; usuario: UsuarioAutenticado } | { ok: false; message: string }> {
  const usuario = await getUsuarioAutenticado();

  if (!usuario || !usuarioEhAdmin(usuario)) {
    return {
      ok: false,
      message: "Voce precisa estar logado como administrador.",
    };
  }

  if (permissao === "edit" && !adminPodeEditar(usuario)) {
    return {
      ok: false,
      message: "Seu perfil nao pode editar este conteudo.",
    };
  }

  if (permissao === "manage" && !adminPodeCriarOuExcluir(usuario)) {
    return {
      ok: false,
      message:
        "Seu perfil pode editar registros existentes, mas nao pode cadastrar nem remover.",
    };
  }

  if (permissao === "users" && !adminPodeGerenciarPermissoes(usuario)) {
    return {
      ok: false,
      message: "Apenas administradores master podem gerenciar usuarios e permissoes.",
    };
  }

  return { ok: true, usuario };
}

