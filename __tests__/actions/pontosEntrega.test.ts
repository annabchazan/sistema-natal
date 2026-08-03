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
import {
  salvarPontoEntrega,
  excluirPontoEntrega,
  listarPontosEntrega,
} from "@/app/actions/pontosEntrega";

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

// ─── salvarPontoEntrega ─────────────────────────────────────────────────────

describe("salvarPontoEntrega", () => {
  it("rejeita quando o usuário não tem permissão", async () => {
    mockPermissao.mockResolvedValue({ ok: false, message: "Voce precisa estar logado como administrador." });
    const res = await salvarPontoEntrega(null, formData({
      nome_local: "Recreação",
      endereco: "Rua X, 1",
      horario: "9h-17h",
    }));
    expect(res.success).toBe(false);
    expect(mockDb.query).not.toHaveBeenCalled();
  });

  it("rejeita campos obrigatórios vazios", async () => {
    mockPermissao.mockResolvedValue({ ok: true, usuario: usuarioFake });
    const res = await salvarPontoEntrega(null, formData({
      nome_local: "",
      endereco: "",
      horario: "",
    }));
    expect(res.success).toBe(false);
    expect(res.message).toMatch(/nome, endereco e horario/i);
    expect(mockDb.query).not.toHaveBeenCalled();
  });

  it("insere novo ponto de entrega quando não há id", async () => {
    mockPermissao.mockResolvedValue({ ok: true, usuario: usuarioFake });
    mockDb.query.mockResolvedValue([{ insertId: 1 }]);
    const res = await salvarPontoEntrega(null, formData({
      nome_local: "Recreação",
      endereco: "Rua X, 1",
      horario: "9h-17h",
    }));
    expect(res.success).toBe(true);
    expect(res.message).toMatch(/cadastrado/i);
    expect(mockDb.query).toHaveBeenCalledWith(
      expect.stringMatching(/INSERT INTO pontos_entrega/i),
      ["Recreação", "Rua X, 1", "9h-17h"],
    );
  });

  it("atualiza ponto de entrega existente quando há id", async () => {
    mockPermissao.mockResolvedValue({ ok: true, usuario: usuarioFake });
    mockDb.query.mockResolvedValue([{ affectedRows: 1 }]);
    const res = await salvarPontoEntrega(null, formData({
      id: "2",
      nome_local: "Casa da Bia",
      endereco: "Rua Y, 2",
      horario: "7h",
    }));
    expect(res.success).toBe(true);
    expect(res.message).toMatch(/atualizado/i);
    expect(mockDb.query).toHaveBeenCalledWith(
      expect.stringMatching(/UPDATE pontos_entrega/i),
      ["Casa da Bia", "Rua Y, 2", "7h", 2],
    );
  });

  it("retorna erro genérico quando o banco falha", async () => {
    mockPermissao.mockResolvedValue({ ok: true, usuario: usuarioFake });
    mockDb.query.mockRejectedValue(new Error("conexão perdida"));
    const res = await salvarPontoEntrega(null, formData({
      nome_local: "Recreação",
      endereco: "Rua X, 1",
      horario: "9h-17h",
    }));
    expect(res.success).toBe(false);
  });
});

// ─── excluirPontoEntrega ────────────────────────────────────────────────────

describe("excluirPontoEntrega", () => {
  it("rejeita quando o usuário não tem permissão", async () => {
    mockPermissao.mockResolvedValue({ ok: false, message: "Seu perfil pode editar registros existentes, mas nao pode cadastrar nem remover." });
    const res = await excluirPontoEntrega(1);
    expect(res.success).toBe(false);
    expect(mockDb.query).not.toHaveBeenCalled();
  });

  it("exclui com sucesso quando tem permissão", async () => {
    mockPermissao.mockResolvedValue({ ok: true, usuario: usuarioFake });
    mockDb.query.mockResolvedValue([{ affectedRows: 1 }]);
    const res = await excluirPontoEntrega(1);
    expect(res.success).toBe(true);
    expect(mockDb.query).toHaveBeenCalledWith(
      expect.stringMatching(/DELETE FROM pontos_entrega/i),
      [1],
    );
  });

  it("retorna mensagem de erro quando exclusão falha", async () => {
    mockPermissao.mockResolvedValue({ ok: true, usuario: usuarioFake });
    mockDb.query.mockRejectedValue(new Error("erro qualquer"));
    const res = await excluirPontoEntrega(1);
    expect(res.success).toBe(false);
  });
});

// ─── listarPontosEntrega ────────────────────────────────────────────────────

describe("listarPontosEntrega", () => {
  it("retorna a lista de pontos do banco", async () => {
    mockDb.query.mockResolvedValue([[
      { id: 1, nome_local: "Recreação", endereco: "Rua X, 1", horario: "9h-17h" },
    ]]);
    const pontos = await listarPontosEntrega();
    expect(pontos).toHaveLength(1);
    expect(pontos[0].nome_local).toBe("Recreação");
  });

  it("retorna lista vazia em vez de lançar erro quando o banco falha", async () => {
    mockDb.query.mockRejectedValue(new Error("conexão perdida"));
    const pontos = await listarPontosEntrega();
    expect(pontos).toEqual([]);
  });
});
