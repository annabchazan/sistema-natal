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
import { salvarTag, excluirTag, listarTags } from "@/app/actions/tags";

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

// ─── salvarTag ──────────────────────────────────────────────────────────────

describe("salvarTag", () => {
  it("rejeita quando o usuário não tem permissão", async () => {
    mockPermissao.mockResolvedValue({ ok: false, message: "Voce precisa estar logado como administrador." });
    const res = await salvarTag(null, formData({ nome: "Menino" }));
    expect(res.success).toBe(false);
    expect(mockDb.query).not.toHaveBeenCalled();
  });

  it("rejeita nome vazio", async () => {
    mockPermissao.mockResolvedValue({ ok: true, usuario: usuarioFake });
    const res = await salvarTag(null, formData({ nome: "  " }));
    expect(res.success).toBe(false);
    expect(res.message).toMatch(/nome/i);
    expect(mockDb.query).not.toHaveBeenCalled();
  });

  it("insere nova tag quando não há id", async () => {
    mockPermissao.mockResolvedValue({ ok: true, usuario: usuarioFake });
    mockDb.query.mockResolvedValue([{ insertId: 1 }]);
    const res = await salvarTag(null, formData({ nome: "Menino" }));
    expect(res.success).toBe(true);
    expect(res.message).toMatch(/cadastrada/i);
    expect(mockDb.query).toHaveBeenCalledWith(
      expect.stringMatching(/INSERT INTO tags/i),
      ["Menino"],
    );
  });

  it("atualiza tag existente quando há id", async () => {
    mockPermissao.mockResolvedValue({ ok: true, usuario: usuarioFake });
    mockDb.query.mockResolvedValue([{ affectedRows: 1 }]);
    const res = await salvarTag(null, formData({ id: "3", nome: "Menina" }));
    expect(res.success).toBe(true);
    expect(res.message).toMatch(/atualizada/i);
    expect(mockDb.query).toHaveBeenCalledWith(
      expect.stringMatching(/UPDATE tags/i),
      ["Menina", 3],
    );
  });

  it("retorna erro genérico quando o banco falha", async () => {
    mockPermissao.mockResolvedValue({ ok: true, usuario: usuarioFake });
    mockDb.query.mockRejectedValue(new Error("conexão perdida"));
    const res = await salvarTag(null, formData({ nome: "Menino" }));
    expect(res.success).toBe(false);
  });
});

// ─── excluirTag ─────────────────────────────────────────────────────────────

describe("excluirTag", () => {
  it("rejeita quando o usuário não tem permissão", async () => {
    mockPermissao.mockResolvedValue({ ok: false, message: "Seu perfil pode editar registros existentes, mas nao pode cadastrar nem remover." });
    const res = await excluirTag(1);
    expect(res.success).toBe(false);
    expect(mockDb.query).not.toHaveBeenCalled();
  });

  it("exclui com sucesso quando tem permissão", async () => {
    mockPermissao.mockResolvedValue({ ok: true, usuario: usuarioFake });
    mockDb.query.mockResolvedValue([{ affectedRows: 1 }]);
    const res = await excluirTag(1);
    expect(res.success).toBe(true);
    expect(mockDb.query).toHaveBeenCalledWith(
      expect.stringMatching(/DELETE FROM tags/i),
      [1],
    );
  });

  it("retorna mensagem amigável quando exclusão falha (ex: tag em uso)", async () => {
    mockPermissao.mockResolvedValue({ ok: true, usuario: usuarioFake });
    mockDb.query.mockRejectedValue(new Error("foreign key constraint fails"));
    const res = await excluirTag(1);
    expect(res.success).toBe(false);
    expect(res.message).toMatch(/em uso/i);
  });
});

// ─── listarTags ─────────────────────────────────────────────────────────────

describe("listarTags", () => {
  it("retorna a lista de tags do banco", async () => {
    mockDb.query.mockResolvedValue([[{ id: 1, nome: "Menino" }, { id: 2, nome: "Menina" }]]);
    const tags = await listarTags();
    expect(tags).toHaveLength(2);
    expect(tags[0].nome).toBe("Menino");
  });

  it("retorna lista vazia em vez de lançar erro quando o banco falha", async () => {
    mockDb.query.mockRejectedValue(new Error("conexão perdida"));
    const tags = await listarTags();
    expect(tags).toEqual([]);
  });
});
