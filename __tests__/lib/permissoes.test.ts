import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const cookieJar = new Map<string, string>();
const cookieSet = vi.fn();
const cookieDelete = vi.fn();

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (nome: string) => (cookieJar.has(nome) ? { value: cookieJar.get(nome) } : undefined),
    set: cookieSet,
    delete: cookieDelete,
  }),
}));

// O redirect real do Next interrompe a execução lançando um erro; o mock imita isso.
vi.mock("next/navigation", () => ({
  redirect: vi.fn((destino: string) => {
    throw new Error(`REDIRECT:${destino}`);
  }),
}));

vi.mock("@/lib/db", () => ({
  default: { query: vi.fn() },
}));

import db from "@/lib/db";
import {
  SESSION_COOKIE,
  JANELA_BLOQUEIO_LOGIN_MS,
  LIMITE_TENTATIVAS_LOGIN,
  adminPodeCriarOuExcluir,
  adminPodeEditar,
  adminPodeGerenciarPermissoes,
  calcularBloqueioAposFalha,
  criarSessao,
  limparSessao,
  requireAdminAccess,
  requireUsuarioAutenticado,
  revogarSessoesDoUsuario,
  usuarioEhAdmin,
  validarPermissaoAdmin,
  type UsuarioAutenticado,
} from "@/lib/auth";
import { sha256Hex } from "@/lib/seguranca";

const mockQuery = (db as unknown as { query: ReturnType<typeof vi.fn> }).query;
const TOKEN = "b".repeat(64);

function usuario(tipo: "admin" | "padrinho", admin_role: UsuarioAutenticado["admin_role"] = null): UsuarioAutenticado {
  return { id: 1, nome: "Teste", telefone: "21999999999", email: "t@t.com", tipo, admin_role, politica_versao: "1.0" };
}

const padrinho = usuario("padrinho");
const editor = usuario("admin", "editor");
const full = usuario("admin", "full");
const master = usuario("admin", "master");

// Faz getUsuarioAutenticado() devolver o usuário informado (ou nenhum).
function logarComo(u: UsuarioAutenticado | null) {
  cookieJar.set(SESSION_COOKIE, TOKEN);
  mockQuery.mockResolvedValue([u ? [u] : []]);
}

beforeEach(() => {
  cookieJar.clear();
  cookieSet.mockReset();
  cookieDelete.mockReset();
  mockQuery.mockReset();
  mockQuery.mockResolvedValue([[]]);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

// ─── Papéis de administrador ────────────────────────────────────────────────

describe("usuarioEhAdmin", () => {
  it("é verdadeiro só para tipo admin", () => {
    expect(usuarioEhAdmin(editor)).toBe(true);
    expect(usuarioEhAdmin(full)).toBe(true);
    expect(usuarioEhAdmin(master)).toBe(true);
  });

  it("é falso para padrinho, null e undefined", () => {
    expect(usuarioEhAdmin(padrinho)).toBe(false);
    expect(usuarioEhAdmin(null)).toBe(false);
    expect(usuarioEhAdmin(undefined)).toBe(false);
  });

  it("padrinho com admin_role preenchido continua não sendo admin", () => {
    expect(usuarioEhAdmin({ ...padrinho, admin_role: "master" })).toBe(false);
  });
});

describe("adminPodeEditar", () => {
  it("permite qualquer papel de admin", () => {
    expect(adminPodeEditar(editor)).toBe(true);
    expect(adminPodeEditar(full)).toBe(true);
    expect(adminPodeEditar(master)).toBe(true);
  });

  it("nega padrinho e visitante", () => {
    expect(adminPodeEditar(padrinho)).toBe(false);
    expect(adminPodeEditar(null)).toBe(false);
    expect(adminPodeEditar(undefined)).toBe(false);
  });
});

describe("adminPodeCriarOuExcluir", () => {
  it("permite full e master", () => {
    expect(adminPodeCriarOuExcluir(full)).toBe(true);
    expect(adminPodeCriarOuExcluir(master)).toBe(true);
  });

  it("nega editor", () => {
    expect(adminPodeCriarOuExcluir(editor)).toBe(false);
  });

  it("nega admin sem papel definido", () => {
    expect(adminPodeCriarOuExcluir(usuario("admin", null))).toBe(false);
  });

  it("nega padrinho, mesmo com papel de admin preenchido, e visitante", () => {
    expect(adminPodeCriarOuExcluir(padrinho)).toBe(false);
    expect(adminPodeCriarOuExcluir({ ...padrinho, admin_role: "full" })).toBe(false);
    expect(adminPodeCriarOuExcluir({ ...padrinho, admin_role: "master" })).toBe(false);
    expect(adminPodeCriarOuExcluir(null)).toBe(false);
    expect(adminPodeCriarOuExcluir(undefined)).toBe(false);
  });
});

describe("adminPodeGerenciarPermissoes", () => {
  it("permite só master", () => {
    expect(adminPodeGerenciarPermissoes(master)).toBe(true);
  });

  it("nega editor e full", () => {
    expect(adminPodeGerenciarPermissoes(editor)).toBe(false);
    expect(adminPodeGerenciarPermissoes(full)).toBe(false);
  });

  it("nega padrinho com papel master preenchido e visitante", () => {
    expect(adminPodeGerenciarPermissoes({ ...padrinho, admin_role: "master" })).toBe(false);
    expect(adminPodeGerenciarPermissoes(null)).toBe(false);
    expect(adminPodeGerenciarPermissoes(undefined)).toBe(false);
  });
});

// ─── validarPermissaoAdmin ──────────────────────────────────────────────────

describe("validarPermissaoAdmin", () => {
  const MSG_LOGIN = "Voce precisa estar logado como administrador.";
  const MSG_EDITAR = "Seu perfil nao pode editar este conteudo.";
  const MSG_GERENCIAR = "Seu perfil pode editar registros existentes, mas nao pode cadastrar nem remover.";
  const MSG_USUARIOS = "Apenas Super Adm pode gerenciar usuarios e permissoes.";

  it("recusa visitante sem sessão em qualquer permissão", async () => {
    for (const p of ["edit", "manage", "users"] as const) {
      expect(await validarPermissaoAdmin(p)).toEqual({ ok: false, message: MSG_LOGIN });
    }
  });

  it("recusa padrinho logado em qualquer permissão", async () => {
    logarComo(padrinho);
    for (const p of ["edit", "manage", "users"] as const) {
      expect(await validarPermissaoAdmin(p)).toEqual({ ok: false, message: MSG_LOGIN });
    }
  });

  it("edit: libera todos os papéis de admin e devolve o usuário", async () => {
    for (const u of [editor, full, master]) {
      logarComo(u);
      expect(await validarPermissaoAdmin("edit")).toEqual({ ok: true, usuario: u });
    }
  });

  it("manage: bloqueia editor e libera full e master", async () => {
    logarComo(editor);
    expect(await validarPermissaoAdmin("manage")).toEqual({ ok: false, message: MSG_GERENCIAR });

    for (const u of [full, master]) {
      logarComo(u);
      expect(await validarPermissaoAdmin("manage")).toEqual({ ok: true, usuario: u });
    }
  });

  it("users: bloqueia editor e full e libera só master", async () => {
    logarComo(editor);
    expect(await validarPermissaoAdmin("users")).toEqual({ ok: false, message: MSG_USUARIOS });
    logarComo(full);
    expect(await validarPermissaoAdmin("users")).toEqual({ ok: false, message: MSG_USUARIOS });

    logarComo(master);
    expect(await validarPermissaoAdmin("users")).toEqual({ ok: true, usuario: master });
  });

  it("a mensagem de edição só aparece quando falta permissão de edição", async () => {
    // admin sempre pode editar; garante que MSG_EDITAR não vaza para os outros casos
    logarComo(editor);
    const r = await validarPermissaoAdmin("manage");
    expect(r).not.toEqual({ ok: false, message: MSG_EDITAR });
  });
});

// ─── Rotas protegidas ───────────────────────────────────────────────────────

describe("requireUsuarioAutenticado", () => {
  it("manda visitante para /login", async () => {
    await expect(requireUsuarioAutenticado()).rejects.toThrow("REDIRECT:/login");
  });

  it("devolve o usuário quando há sessão válida", async () => {
    logarComo(padrinho);
    await expect(requireUsuarioAutenticado()).resolves.toEqual(padrinho);
  });
});

describe("requireAdminAccess", () => {
  it("manda visitante para o login preservando o destino /admin", async () => {
    await expect(requireAdminAccess()).rejects.toThrow("REDIRECT:/login?next=/admin");
  });

  it("manda padrinho logado para /usuario", async () => {
    logarComo(padrinho);
    await expect(requireAdminAccess()).rejects.toThrow("REDIRECT:/usuario");
  });

  it("devolve o usuário quando é admin", async () => {
    logarComo(editor);
    await expect(requireAdminAccess()).resolves.toEqual(editor);
  });
});

// ─── Bloqueio de login por tentativas ───────────────────────────────────────

describe("calcularBloqueioAposFalha", () => {
  const agora = new Date("2026-11-03T12:00:00Z");

  it("usa 5 tentativas e 15 minutos", () => {
    expect(LIMITE_TENTATIVAS_LOGIN).toBe(5);
    expect(JANELA_BLOQUEIO_LOGIN_MS).toBe(15 * 60 * 1000);
  });

  it("primeira falha conta 1 e não bloqueia", () => {
    expect(calcularBloqueioAposFalha(0, null, agora)).toEqual({ tentativas: 1, bloqueadoAte: null });
  });

  it("a 4ª falha ainda não bloqueia", () => {
    expect(calcularBloqueioAposFalha(3, null, agora)).toEqual({ tentativas: 4, bloqueadoAte: null });
  });

  it("a 5ª falha bloqueia por 15 minutos a partir de agora", () => {
    const r = calcularBloqueioAposFalha(4, null, agora);
    expect(r.tentativas).toBe(5);
    expect(r.bloqueadoAte).toEqual(new Date("2026-11-03T12:15:00Z"));
  });

  it("falhas além do limite continuam bloqueando e renovam o prazo", () => {
    const r = calcularBloqueioAposFalha(7, new Date("2026-11-03T12:10:00Z"), agora);
    expect(r.tentativas).toBe(8);
    expect(r.bloqueadoAte).toEqual(new Date("2026-11-03T12:15:00Z"));
  });

  it("bloqueio ainda vigente não zera o contador", () => {
    const r = calcularBloqueioAposFalha(5, new Date("2026-11-03T12:05:00Z"), agora);
    expect(r.tentativas).toBe(6);
  });

  it("bloqueio que expira exatamente agora recomeça a contagem em 1", () => {
    const r = calcularBloqueioAposFalha(5, agora, agora);
    expect(r).toEqual({ tentativas: 1, bloqueadoAte: null });
  });

  it("bloqueio já expirado recomeça a contagem em 1 e libera", () => {
    const r = calcularBloqueioAposFalha(9, new Date("2026-11-03T11:00:00Z"), agora);
    expect(r).toEqual({ tentativas: 1, bloqueadoAte: null });
  });

  it("sem data de bloqueio, não trata como expirado", () => {
    expect(calcularBloqueioAposFalha(2, null, agora).tentativas).toBe(3);
  });

  it("sem informar a hora, usa o relógio atual", () => {
    const antes = Date.now();
    const r = calcularBloqueioAposFalha(4, null);
    const ate = r.bloqueadoAte!.getTime();
    expect(ate).toBeGreaterThanOrEqual(antes + JANELA_BLOQUEIO_LOGIN_MS);
    expect(ate).toBeLessThanOrEqual(Date.now() + JANELA_BLOQUEIO_LOGIN_MS);
  });
});

// ─── Sessão: lacunas ────────────────────────────────────────────────────────

describe("criarSessao (detalhes)", () => {
  it("apaga as sessões expiradas do próprio usuário antes de criar a nova", async () => {
    await criarSessao(42);
    const [sql, params] = mockQuery.mock.calls[0];
    expect(String(sql)).toContain("DELETE FROM sessoes");
    expect(String(sql)).toContain("usuario_id = ?");
    expect(String(sql)).toContain("expira_em < NOW()");
    expect(params).toEqual([42]);
    expect(String(mockQuery.mock.calls[1][0])).toContain("INSERT INTO sessoes");
  });

  it("o cookie dura 7 dias e é secure em produção", async () => {
    vi.stubEnv("NODE_ENV", "production");
    await criarSessao(1);
    const opcoes = cookieSet.mock.calls[0][2];
    expect(opcoes.secure).toBe(true);
    expect(opcoes.maxAge).toBe(60 * 60 * 24 * 7);
  });

  it("o cookie não é secure fora de produção (desenvolvimento local em http)", async () => {
    vi.stubEnv("NODE_ENV", "development");
    await criarSessao(1);
    expect(cookieSet.mock.calls[0][2].secure).toBe(false);
  });
});

describe("limparSessao (detalhes)", () => {
  it("sem cookie, não toca no banco mas limpa o cookie", async () => {
    await limparSessao();
    expect(mockQuery).not.toHaveBeenCalled();
    expect(cookieDelete).toHaveBeenCalledWith(SESSION_COOKIE);
  });

  it("com cookie de formato inválido, não toca no banco mas limpa o cookie", async () => {
    cookieJar.set(SESSION_COOKIE, "nao-e-um-token");
    await limparSessao();
    expect(mockQuery).not.toHaveBeenCalled();
    expect(cookieDelete).toHaveBeenCalledWith(SESSION_COOKIE);
  });
});

describe("revogarSessoesDoUsuario (detalhes)", () => {
  it("por padrão derruba todas, mesmo havendo cookie válido", async () => {
    cookieJar.set(SESSION_COOKIE, TOKEN);
    await revogarSessoesDoUsuario(9);
    expect(mockQuery).toHaveBeenCalledTimes(1);
    expect(mockQuery).toHaveBeenCalledWith("DELETE FROM sessoes WHERE usuario_id = ?", [9]);
  });

  it("manterAtual sem cookie derruba todas", async () => {
    await revogarSessoesDoUsuario(9, true);
    expect(mockQuery).toHaveBeenCalledWith("DELETE FROM sessoes WHERE usuario_id = ?", [9]);
  });

  it("manterAtual com cookie de formato inválido derruba todas", async () => {
    cookieJar.set(SESSION_COOKIE, "invalido");
    await revogarSessoesDoUsuario(9, true);
    expect(mockQuery).toHaveBeenCalledTimes(1);
    expect(mockQuery).toHaveBeenCalledWith("DELETE FROM sessoes WHERE usuario_id = ?", [9]);
  });

  it("manterAtual com cookie válido preserva só a sessão atual", async () => {
    cookieJar.set(SESSION_COOKIE, TOKEN);
    await revogarSessoesDoUsuario(9, true);
    expect(mockQuery).toHaveBeenCalledTimes(1);
    expect(mockQuery).toHaveBeenCalledWith(
      "DELETE FROM sessoes WHERE usuario_id = ? AND token_hash <> ?",
      [9, sha256Hex(TOKEN)],
    );
  });
});
