import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  default: { query: vi.fn(), getConnection: vi.fn() },
}));

vi.mock("@/lib/auth", () => ({
  getUsuarioAutenticado: vi.fn(),
  gerarHashSenha: vi.fn().mockReturnValue("salt:novohash"),
  validarSenha: vi.fn(),
  limparSessao: vi.fn(),
}));

vi.mock("@/lib/email", () => ({
  enviarEmailRecuperacaoSenha: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import db from "@/lib/db";
import { getUsuarioAutenticado, validarSenha, gerarHashSenha, limparSessao } from "@/lib/auth";
import { enviarEmailRecuperacaoSenha } from "@/lib/email";
import { redefinirSenha, atualizarPerfil, solicitarRecuperacaoSenha, excluirConta } from "@/app/actions/auth";

const mockDb = db as unknown as { query: ReturnType<typeof vi.fn>; getConnection: ReturnType<typeof vi.fn> };
const mockGetUsuario = vi.mocked(getUsuarioAutenticado);
const mockValidarSenha = vi.mocked(validarSenha);
const mockGerarHash = vi.mocked(gerarHashSenha);
const mockEnviarRecuperacao = vi.mocked(enviarEmailRecuperacaoSenha);
const mockLimparSessao = vi.mocked(limparSessao);

const usuarioFake = { id: 1, nome: "Padrinho", telefone: "21999999999", email: "padrinho@teste.com", tipo: "padrinho" as const, admin_role: null };

function mockConexao(queryResults: unknown[] = []) {
  let chamada = 0;
  const conn = {
    beginTransaction: vi.fn(),
    query: vi.fn().mockImplementation(() => Promise.resolve(queryResults[chamada++] ?? [[]])),
    commit: vi.fn(),
    rollback: vi.fn(),
    release: vi.fn(),
  };
  mockDb.getConnection.mockResolvedValue(conn);
  return conn;
}

beforeEach(() => vi.resetAllMocks());

// ─── redefinirSenha ───────────────────────────────────────────────────────────

describe("redefinirSenha", () => {
  it("rejeita token vazio", async () => {
    const res = await redefinirSenha("", "novasenha");
    expect(res.success).toBe(false);
    expect(res.message).toMatch(/inválido/i);
  });

  it("rejeita senha com menos de 6 caracteres", async () => {
    const res = await redefinirSenha("tokenvalido", "abc");
    expect(res.success).toBe(false);
    expect(res.message).toMatch(/6 caracteres/i);
  });

  it("rejeita token inexistente ou expirado no banco", async () => {
    mockDb.query.mockResolvedValue([[]]); // nenhum resultado
    const res = await redefinirSenha("tokeninvalido", "novasenha123");
    expect(res.success).toBe(false);
    expect(res.message).toMatch(/inválido ou expirado/i);
  });

  it("redefine senha com sucesso", async () => {
    mockDb.query
      .mockResolvedValueOnce([[{ id: 5 }]])      // SELECT token válido
      .mockResolvedValueOnce([{ affectedRows: 1 }]); // UPDATE senha
    const res = await redefinirSenha("tokenok", "novasenha123");
    expect(res.success).toBe(true);
    expect(res.message).toMatch(/sucesso/i);
  });
});

// ─── atualizarPerfil ──────────────────────────────────────────────────────────

describe("atualizarPerfil", () => {
  it("rejeita quando usuário não está logado", async () => {
    mockGetUsuario.mockResolvedValue(null);
    const res = await atualizarPerfil({ nome: "X", telefone: "1", email: "a@b.com" });
    expect(res.success).toBe(false);
    expect(res.message).toMatch(/logado/i);
  });

  it("rejeita campos obrigatórios vazios", async () => {
    mockGetUsuario.mockResolvedValue(usuarioFake);
    const res = await atualizarPerfil({ nome: "", telefone: "", email: "" });
    expect(res.success).toBe(false);
    expect(res.message).toMatch(/obrigatórios/i);
  });

  it("rejeita e-mail já em uso por outro usuário", async () => {
    mockGetUsuario.mockResolvedValue(usuarioFake);
    mockDb.query.mockResolvedValueOnce([[{ id: 99 }]]); // e-mail já existe
    const res = await atualizarPerfil({ nome: "Padrinho", telefone: "21999999999", email: "outro@email.com" });
    expect(res.success).toBe(false);
    expect(res.message).toMatch(/já está em uso/i);
  });

  it("rejeita nova senha com menos de 6 caracteres", async () => {
    mockGetUsuario.mockResolvedValue(usuarioFake);
    // mesmo e-mail → sem query de verificação de email
    mockDb.query.mockResolvedValueOnce([[{ senha: "salt:hash" }]]); // SELECT senha
    mockValidarSenha.mockReturnValue(true); // senha atual correta
    const res = await atualizarPerfil({
      nome: "Padrinho",
      telefone: "21999999999",
      email: "padrinho@teste.com",
      senhaAtual: "senhaatual",
      novaSenha: "abc",
    });
    expect(res.success).toBe(false);
    expect(res.message).toMatch(/6 caracteres/i);
  });

  it("rejeita quando senha atual está incorreta", async () => {
    mockGetUsuario.mockResolvedValue(usuarioFake);
    mockDb.query
      .mockResolvedValueOnce([[]])                        // e-mail livre (mesmo e-mail)
      .mockResolvedValueOnce([[{ senha: "salt:hash" }]]); // SELECT senha
    mockValidarSenha.mockReturnValue(false);
    const res = await atualizarPerfil({
      nome: "Padrinho",
      telefone: "21999999999",
      email: "padrinho@teste.com",
      senhaAtual: "errada",
      novaSenha: "novasenha123",
    });
    expect(res.success).toBe(false);
    expect(res.message).toMatch(/senha atual incorreta/i);
  });

  it("atualiza dados sem trocar senha", async () => {
    mockGetUsuario.mockResolvedValue(usuarioFake);
    mockDb.query
      .mockResolvedValueOnce([[]])                    // e-mail livre
      .mockResolvedValueOnce([{ affectedRows: 1 }]); // UPDATE
    const res = await atualizarPerfil({ nome: "Novo Nome", telefone: "21888888888", email: "padrinho@teste.com" });
    expect(res.success).toBe(true);
  });

  it("atualiza dados e senha quando senha atual está correta", async () => {
    mockGetUsuario.mockResolvedValue(usuarioFake);
    mockValidarSenha.mockReturnValue(true);
    mockGerarHash.mockReturnValue("salt:novohash");
    // mesmo e-mail → sem query de verificação de email
    mockDb.query
      .mockResolvedValueOnce([[{ senha: "salt:hash" }]]) // SELECT senha atual
      .mockResolvedValueOnce([{ affectedRows: 1 }]);     // UPDATE com nova senha
    const res = await atualizarPerfil({
      nome: "Padrinho",
      telefone: "21999999999",
      email: "padrinho@teste.com",
      senhaAtual: "senhaatual",
      novaSenha: "novasenha123",
    });
    expect(res.success).toBe(true);
    expect(res.message).toMatch(/senha/i);
  });
});

// ─── solicitarRecuperacaoSenha ────────────────────────────────────────────────

describe("solicitarRecuperacaoSenha", () => {
  it("retorna mensagem genérica quando e-mail não existe (não vaza informação)", async () => {
    mockDb.query.mockResolvedValue([[]]); // nenhum usuário encontrado
    const res = await solicitarRecuperacaoSenha("naoexiste@email.com");
    expect(res.success).toBe(true); // sempre true para não revelar se e-mail existe
    expect(res.message).toMatch(/se este e-mail/i);
  });

  it("retorna mensagem genérica também quando e-mail existe", async () => {
    mockEnviarRecuperacao.mockResolvedValue(undefined);
    mockDb.query
      .mockResolvedValueOnce([[{ id: 1 }]])          // usuário encontrado
      .mockResolvedValueOnce([{ affectedRows: 1 }]); // UPDATE token
    const res = await solicitarRecuperacaoSenha("existe@email.com");
    expect(res.success).toBe(true);
    expect(res.message).toMatch(/se este e-mail/i);
  });

  it("rejeita e-mail vazio", async () => {
    const res = await solicitarRecuperacaoSenha("   ");
    expect(res.success).toBe(false);
    expect(res.message).toMatch(/válido/i);
  });
});

// ─── excluirConta ───────────────────────────────────────────────────────────

describe("excluirConta", () => {
  it("rejeita quando usuário não está logado", async () => {
    mockGetUsuario.mockResolvedValue(null);
    const res = await excluirConta();
    expect(res.success).toBe(false);
    expect(res.message).toMatch(/logado/i);
  });

  it("rejeita contas de administrador", async () => {
    mockGetUsuario.mockResolvedValue({ ...usuarioFake, tipo: "admin" });
    const res = await excluirConta();
    expect(res.success).toBe(false);
    expect(res.message).toMatch(/administrador/i);
  });

  it("bloqueia quando há cartinhas em andamento (conferida/embrulhado/reapadrinhado)", async () => {
    mockGetUsuario.mockResolvedValue(usuarioFake);
    const conn = mockConexao([
      [[{ total: 1 }]], // SELECT COUNT(*) ... FOR UPDATE
    ]);
    const res = await excluirConta();
    expect(res.success).toBe(false);
    expect(res.message).toMatch(/em andamento/i);
    expect(conn.rollback).toHaveBeenCalled();
    expect(conn.query.mock.calls.length).toBe(1); // não segue adiante
  });

  it("exclui a conta preservando o snapshot de cartinhas entregues", async () => {
    mockGetUsuario.mockResolvedValue(usuarioFake);
    const conn = mockConexao([
      [[{ total: 0 }]],       // SELECT COUNT(*) ... FOR UPDATE — nenhuma em andamento
      [{ affectedRows: 1 }],  // INSERT INTO desistencias
      [{ affectedRows: 1 }],  // UPDATE ... status = 'carente' (apadrinhada)
      [{ affectedRows: 1 }],  // UPDATE ... snapshot + NULL (entregue)
      [{ affectedRows: 1 }],  // UPDATE ... NULL sem snapshot (demais status)
      [{ affectedRows: 1 }],  // DELETE FROM lembretes_enviados
      [{ affectedRows: 1 }],  // DELETE FROM usuarios
    ]);

    const res = await excluirConta();

    expect(res.success).toBe(true);
    expect(conn.commit).toHaveBeenCalled();
    expect(mockLimparSessao).toHaveBeenCalled();

    // 4ª chamada = UPDATE de snapshot das entregues
    expect(conn.query).toHaveBeenNthCalledWith(
      4,
      expect.stringMatching(/status = 'entregue'/),
      [usuarioFake.nome, usuarioFake.email, usuarioFake.id],
    );

    // 5ª chamada = UPDATE das demais (sem snapshot)
    expect(conn.query).toHaveBeenNthCalledWith(
      5,
      expect.stringMatching(/status != 'entregue'/),
      [usuarioFake.id],
    );
  });

  it("faz rollback e retorna erro genérico se alguma query falhar", async () => {
    mockGetUsuario.mockResolvedValue(usuarioFake);
    const conn = {
      beginTransaction: vi.fn(),
      query: vi.fn()
        .mockResolvedValueOnce([[{ total: 0 }]])
        .mockRejectedValueOnce(new Error("erro de banco")),
      commit: vi.fn(),
      rollback: vi.fn(),
      release: vi.fn(),
    };
    mockDb.getConnection.mockResolvedValue(conn);
    const res = await excluirConta();
    expect(res.success).toBe(false);
    expect(conn.rollback).toHaveBeenCalled();
  });
});
