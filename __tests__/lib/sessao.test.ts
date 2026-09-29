import { describe, it, expect, vi, beforeEach } from "vitest";

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

vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

vi.mock("@/lib/db", () => ({
  default: { query: vi.fn() },
}));

import db from "@/lib/db";
import {
  SESSION_COOKIE,
  criarSessao,
  getUsuarioAutenticado,
  limparSessao,
  revogarSessoesDoUsuario,
} from "@/lib/auth";
import { sha256Hex } from "@/lib/seguranca";

const mockQuery = (db as unknown as { query: ReturnType<typeof vi.fn> }).query;
const TOKEN = "a".repeat(64);

beforeEach(() => {
  cookieJar.clear();
  cookieSet.mockReset();
  cookieDelete.mockReset();
  mockQuery.mockReset();
  mockQuery.mockResolvedValue([[]]);
});

describe("criarSessao", () => {
  it("grava só o hash do token no banco e o token no cookie httpOnly", async () => {
    await criarSessao(7);

    const [nome, token, opcoes] = cookieSet.mock.calls[0];
    expect(nome).toBe(SESSION_COOKIE);
    expect(token).toMatch(/^[0-9a-f]{64}$/);
    expect(opcoes).toMatchObject({ httpOnly: true, sameSite: "lax", path: "/" });

    const insert = mockQuery.mock.calls.find(([sql]) => String(sql).includes("INSERT INTO sessoes"));
    expect(insert).toBeDefined();
    expect(insert![1]).toContain(sha256Hex(token));
    expect(insert![1]).not.toContain(token);
  });

  it("gera um token diferente a cada login (sem fixação de sessão)", async () => {
    await criarSessao(7);
    await criarSessao(7);
    expect(cookieSet.mock.calls[0][1]).not.toBe(cookieSet.mock.calls[1][1]);
  });
});

describe("getUsuarioAutenticado", () => {
  it("devolve null sem cookie, sem tocar no banco", async () => {
    expect(await getUsuarioAutenticado()).toBeNull();
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it("recusa cookie com formato inválido (o antigo, assinado por HMAC, cai aqui)", async () => {
    cookieJar.set(SESSION_COOKIE, "1.1999999999999.abc.def");
    expect(await getUsuarioAutenticado()).toBeNull();
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it("consulta pelo hash e devolve o usuário quando a sessão existe e não expirou", async () => {
    cookieJar.set(SESSION_COOKIE, TOKEN);
    const usuario = { id: 3, nome: "Ana", telefone: "21999999999", email: "a@b.com", tipo: "padrinho", admin_role: null };
    mockQuery.mockResolvedValueOnce([[usuario]]);

    expect(await getUsuarioAutenticado()).toEqual(usuario);

    const [sql, params] = mockQuery.mock.calls[0];
    expect(String(sql)).toContain("s.expira_em > NOW()");
    expect(params).toEqual([sha256Hex(TOKEN)]);
  });

  it("devolve null quando a sessão foi revogada (linha não existe)", async () => {
    cookieJar.set(SESSION_COOKIE, TOKEN);
    mockQuery.mockResolvedValueOnce([[]]);
    expect(await getUsuarioAutenticado()).toBeNull();
  });
});

describe("limparSessao (logout)", () => {
  it("apaga a sessão no servidor e o cookie", async () => {
    cookieJar.set(SESSION_COOKIE, TOKEN);
    await limparSessao();
    expect(mockQuery).toHaveBeenCalledWith("DELETE FROM sessoes WHERE token_hash = ?", [sha256Hex(TOKEN)]);
    expect(cookieDelete).toHaveBeenCalledWith(SESSION_COOKIE);
  });
});

describe("revogarSessoesDoUsuario", () => {
  it("derruba todas as sessões do usuário", async () => {
    await revogarSessoesDoUsuario(9);
    expect(mockQuery).toHaveBeenCalledWith("DELETE FROM sessoes WHERE usuario_id = ?", [9]);
  });

  it("com manterAtual, preserva só a sessão de quem trocou a senha", async () => {
    cookieJar.set(SESSION_COOKIE, TOKEN);
    await revogarSessoesDoUsuario(9, true);
    expect(mockQuery).toHaveBeenCalledWith(
      "DELETE FROM sessoes WHERE usuario_id = ? AND token_hash <> ?",
      [9, sha256Hex(TOKEN)],
    );
  });
});
