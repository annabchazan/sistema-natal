import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import db from "@/lib/db";
import { SESSION_COOKIE } from "@/lib/sessaoCookie";
import { sha256Hex } from "@/lib/seguranca";
import type { RowDataPacket } from "mysql2/promise";

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

interface UsuarioRow extends RowDataPacket, UsuarioAutenticado {}

export { SESSION_COOKIE };
const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

export function gerarHashSenha(senha: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(senha, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function validarSenha(senha: string, hashArmazenado: string) {
  const partes = hashArmazenado.split(":");
  if (partes.length !== 2) {
    return false;
  }

  const [salt, hashOriginal] = partes;
  const hashCalculado = scryptSync(senha, salt, 64);
  const hashBuffer = Buffer.from(hashOriginal, "hex");

  if (hashCalculado.length !== hashBuffer.length) {
    return false;
  }

  return timingSafeEqual(hashCalculado, hashBuffer);
}

// Usado quando o e-mail não existe, pra não vazar por timing quais e-mails estão cadastrados.
export const HASH_SENHA_INEXISTENTE = gerarHashSenha(randomBytes(32).toString("hex"));

export const LIMITE_TENTATIVAS_LOGIN = 5;
export const JANELA_BLOQUEIO_LOGIN_MS = 15 * 60 * 1000;

export interface EstadoTentativasLogin {
  tentativas: number;
  bloqueadoAte: Date | null;
}

// Rastreado por e-mail digitado (não pelo id do usuário) pra não abrir canal de enumeração de contas.
export function calcularBloqueioAposFalha(
  tentativasAtuais: number,
  bloqueadoAteAtual: Date | null,
  agora: Date = new Date(),
): EstadoTentativasLogin {
  const bloqueioExpirado = bloqueadoAteAtual !== null && bloqueadoAteAtual <= agora;
  const tentativas = bloqueioExpirado ? 1 : tentativasAtuais + 1;

  if (tentativas >= LIMITE_TENTATIVAS_LOGIN) {
    return { tentativas, bloqueadoAte: new Date(agora.getTime() + JANELA_BLOQUEIO_LOGIN_MS) };
  }

  return { tentativas, bloqueadoAte: null };
}

// A sessão é um token aleatório no cookie; no banco fica só o SHA-256 dele (tabela sessoes).
// Assim logout, troca de senha e exclusão de conta derrubam a sessão no servidor.
const FORMATO_TOKEN = /^[0-9a-f]{64}$/;

export async function criarSessao(usuarioId: number) {
  const token = randomBytes(32).toString("hex");

  await db.query("DELETE FROM sessoes WHERE usuario_id = ? AND expira_em < NOW()", [usuarioId]);
  await db.query(
    "INSERT INTO sessoes (token_hash, usuario_id, expira_em) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL ? SECOND))",
    [sha256Hex(token), usuarioId, SESSION_MAX_AGE],
  );

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function limparSessao() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (token && FORMATO_TOKEN.test(token)) {
    await db.query("DELETE FROM sessoes WHERE token_hash = ?", [sha256Hex(token)]);
  }

  cookieStore.delete(SESSION_COOKIE);
}

// Derruba as sessões do usuário (troca/redefinição de senha). Com `manterAtual`,
// preserva a sessão de quem acabou de trocar a senha.
export async function revogarSessoesDoUsuario(usuarioId: number, manterAtual = false) {
  let hashAtual: string | null = null;

  if (manterAtual) {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;
    if (token && FORMATO_TOKEN.test(token)) {
      hashAtual = sha256Hex(token);
    }
  }

  if (hashAtual) {
    await db.query("DELETE FROM sessoes WHERE usuario_id = ? AND token_hash <> ?", [usuarioId, hashAtual]);
  } else {
    await db.query("DELETE FROM sessoes WHERE usuario_id = ?", [usuarioId]);
  }
}

export async function getUsuarioAutenticado(): Promise<UsuarioAutenticado | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token || !FORMATO_TOKEN.test(token)) {
    return null;
  }

  const [rows] = await db.query<UsuarioRow[]>(
    `SELECT u.id, u.nome, u.telefone, u.email, u.tipo, u.admin_role
     FROM sessoes s
     JOIN usuarios u ON u.id = s.usuario_id
     WHERE s.token_hash = ? AND s.expira_em > NOW()
     LIMIT 1`,
    [sha256Hex(token)],
  );

  return rows[0] ?? null;
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
      message: "Apenas Super Adm pode gerenciar usuarios e permissoes.",
    };
  }

  return { ok: true, usuario };
}

