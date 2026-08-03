import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  default: { query: vi.fn() },
}));

vi.mock("@/lib/auth", () => ({
  validarPermissaoAdmin: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import db from "@/lib/db";
import { validarPermissaoAdmin } from "@/lib/auth";
import { salvarInstituicao, excluirInstituicao } from "@/app/actions/instituicoes";

const mockDb = db as unknown as { query: ReturnType<typeof vi.fn> };
const mockPermissao = vi.mocked(validarPermissaoAdmin);

const usuarioFake = {
  id: 1,
  nome: "Admin Teste",
  telefone: "21999999999",
  email: "admin@teste.com",
  tipo: "admin" as const,
  admin_role: "full" as const,
};

function formData(campos: Record<string, string>) {
  const fd = new FormData();
  for (const [chave, valor] of Object.entries(campos)) fd.set(chave, valor);
  return fd;
}

beforeEach(() => {
  vi.resetAllMocks();
});

// ─── salvarInstituicao ──────────────────────────────────────────────────────

describe("salvarInstituicao", () => {
  it("rejeita quando o usuário não tem permissão", async () => {
    mockPermissao.mockResolvedValue({ ok: false, message: "Voce precisa estar logado como administrador." });
    const res = await salvarInstituicao(null, formData({
      nome_instituicao: "Lar das crianças",
      responsavel: "Bia",
      contato: "21999999999",
      quantidade_vagas: "20",
    }));
    expect(res.success).toBe(false);
    expect(res.message).toMatch(/administrador/i);
    expect(mockDb.query).not.toHaveBeenCalled();
  });

  it("rejeita campos obrigatórios vazios", async () => {
    mockPermissao.mockResolvedValue({ ok: true, usuario: usuarioFake });
    const res = await salvarInstituicao(null, formData({
      nome_instituicao: "",
      responsavel: "",
      contato: "",
      quantidade_vagas: "0",
    }));
    expect(res.success).toBe(false);
    expect(res.message).toMatch(/preencha/i);
    expect(mockDb.query).not.toHaveBeenCalled();
  });

  it("rejeita quantidade de vagas não numérica", async () => {
    mockPermissao.mockResolvedValue({ ok: true, usuario: usuarioFake });
    const res = await salvarInstituicao(null, formData({
      nome_instituicao: "Lar das crianças",
      responsavel: "Bia",
      contato: "21999999999",
      quantidade_vagas: "abc",
    }));
    expect(res.success).toBe(false);
    expect(mockDb.query).not.toHaveBeenCalled();
  });

  it("insere nova instituição quando não há id", async () => {
    mockPermissao.mockResolvedValue({ ok: true, usuario: usuarioFake });
    mockDb.query.mockResolvedValue([{ insertId: 1 }]);
    const res = await salvarInstituicao(null, formData({
      nome_instituicao: "Lar das crianças",
      responsavel: "Bia",
      contato: "21999999999",
      quantidade_vagas: "20",
    }));
    expect(res.success).toBe(true);
    expect(res.message).toMatch(/cadastrada/i);
    expect(mockDb.query).toHaveBeenCalledWith(
      expect.stringMatching(/INSERT INTO instituicoes/i),
      ["Lar das crianças", "Bia", "21999999999", 20],
    );
  });

  it("atualiza instituição existente quando há id", async () => {
    mockPermissao.mockResolvedValue({ ok: true, usuario: usuarioFake });
    mockDb.query.mockResolvedValue([{ affectedRows: 1 }]);
    const res = await salvarInstituicao(null, formData({
      id: "5",
      nome_instituicao: "Lar das crianças",
      responsavel: "Bia",
      contato: "21999999999",
      quantidade_vagas: "30",
    }));
    expect(res.success).toBe(true);
    expect(res.message).toMatch(/atualizada/i);
    expect(mockDb.query).toHaveBeenCalledWith(
      expect.stringMatching(/UPDATE instituicoes/i),
      ["Lar das crianças", "Bia", "21999999999", 30, 5],
    );
  });

  it("retorna erro genérico quando o banco falha", async () => {
    mockPermissao.mockResolvedValue({ ok: true, usuario: usuarioFake });
    mockDb.query.mockRejectedValue(new Error("conexão perdida"));
    const res = await salvarInstituicao(null, formData({
      nome_instituicao: "Lar das crianças",
      responsavel: "Bia",
      contato: "21999999999",
      quantidade_vagas: "20",
    }));
    expect(res.success).toBe(false);
    expect(res.message).toMatch(/banco de dados/i);
  });
});

// ─── excluirInstituicao ─────────────────────────────────────────────────────

describe("excluirInstituicao", () => {
  it("rejeita quando o usuário não tem permissão", async () => {
    mockPermissao.mockResolvedValue({ ok: false, message: "Seu perfil pode editar registros existentes, mas nao pode cadastrar nem remover." });
    const res = await excluirInstituicao(1);
    expect(res.success).toBe(false);
    expect(mockDb.query).not.toHaveBeenCalled();
  });

  it("exclui com sucesso quando tem permissão", async () => {
    mockPermissao.mockResolvedValue({ ok: true, usuario: usuarioFake });
    mockDb.query.mockResolvedValue([{ affectedRows: 1 }]);
    const res = await excluirInstituicao(1);
    expect(res.success).toBe(true);
    expect(mockDb.query).toHaveBeenCalledWith(
      expect.stringMatching(/DELETE FROM instituicoes/i),
      [1],
    );
  });

  it("retorna mensagem amigável quando exclusão falha (ex: cartinhas vinculadas)", async () => {
    mockPermissao.mockResolvedValue({ ok: true, usuario: usuarioFake });
    mockDb.query.mockRejectedValue(new Error("foreign key constraint fails"));
    const res = await excluirInstituicao(1);
    expect(res.success).toBe(false);
    expect(res.message).toMatch(/cartinhas vinculadas/i);
  });
});
