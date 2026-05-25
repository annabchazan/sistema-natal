import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  default: { query: vi.fn() },
}));

vi.mock("@/lib/auth", () => ({
  getUsuarioAutenticado: vi.fn(),
  gerarHashSenha: vi.fn().mockReturnValue("salt:novohash"),
  validarSenha: vi.fn(),
}));

vi.mock("@/lib/email", () => ({
  enviarEmailRecuperacaoSenha: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import db from "@/lib/db";
import { getUsuarioAutenticado, validarSenha, gerarHashSenha } from "@/lib/auth";
import { enviarEmailRecuperacaoSenha } from "@/lib/email";
import { redefinirSenha, atualizarPerfil, solicitarRecuperacaoSenha } from "@/app/actions/auth";

const mockDb = db as any;
const mockGetUsuario = getUsuarioAutenticado as any;
const mockValidarSenha = validarSenha as any;
const mockGerarHash = gerarHashSenha as any;
const mockEnviarRecuperacao = enviarEmailRecuperacaoSenha as any;

const usuarioFake = { id: 1, nome: "Padrinho", telefone: "21999999999", email: "padrinho@teste.com", tipo: "padrinho" };

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
