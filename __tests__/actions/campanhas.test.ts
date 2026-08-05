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
  obterOuCriarCampanhaAtiva,
  listarCampanhas,
  finalizarCampanha,
} from "@/app/actions/campanhas";

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

beforeEach(() => {
  vi.resetAllMocks();
});

// ─── obterOuCriarCampanhaAtiva ──────────────────────────────────────────────

describe("obterOuCriarCampanhaAtiva", () => {
  it("retorna o id da campanha ativa existente, sem inserir", async () => {
    mockDb.query.mockResolvedValueOnce([[{ id: 5 }]]);

    const id = await obterOuCriarCampanhaAtiva();

    expect(id).toBe(5);
    expect(mockDb.query).toHaveBeenCalledTimes(1);
    expect(mockDb.query).toHaveBeenCalledWith(
      expect.stringMatching(/SELECT id FROM campanhas WHERE data_encerramento IS NULL/i),
    );
  });

  it("cria uma campanha nova pro ano corrente quando nenhuma está ativa", async () => {
    mockDb.query
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([{ insertId: 9 }]);

    const id = await obterOuCriarCampanhaAtiva();

    expect(id).toBe(9);
    expect(mockDb.query).toHaveBeenCalledWith(
      expect.stringMatching(/INSERT INTO campanhas/i),
      [new Date().getFullYear()],
    );
  });
});

// ─── listarCampanhas ────────────────────────────────────────────────────────

describe("listarCampanhas", () => {
  it("retorna a lista de campanhas do banco", async () => {
    mockDb.query.mockResolvedValue([[
      { id: 1, ano: 2026, data_encerramento: null },
    ]]);

    const campanhas = await listarCampanhas();

    expect(campanhas).toHaveLength(1);
    expect(campanhas[0].ano).toBe(2026);
  });

  it("retorna lista vazia em vez de lançar erro quando o banco falha", async () => {
    mockDb.query.mockRejectedValue(new Error("conexão perdida"));

    const campanhas = await listarCampanhas();

    expect(campanhas).toEqual([]);
  });
});

// ─── finalizarCampanha ──────────────────────────────────────────────────────

describe("finalizarCampanha", () => {
  it("rejeita quando o usuário não tem permissão", async () => {
    mockPermissao.mockResolvedValue({ ok: false, message: "Voce precisa estar logado como administrador." });

    const res = await finalizarCampanha();

    expect(res.success).toBe(false);
    expect(mockDb.query).not.toHaveBeenCalled();
  });

  it("retorna erro quando não há campanha ativa pra encerrar", async () => {
    mockPermissao.mockResolvedValue({ ok: true, usuario: usuarioFake });
    mockDb.query.mockResolvedValueOnce([[]]);

    const res = await finalizarCampanha();

    expect(res.success).toBe(false);
    expect(res.message).toMatch(/não há campanha ativa/i);
  });

  it("calcula os agregados e encerra a campanha ativa", async () => {
    mockPermissao.mockResolvedValue({ ok: true, usuario: usuarioFake });
    mockDb.query
      .mockResolvedValueOnce([[{ id: 3 }]])
      .mockResolvedValueOnce([[
        {
          total_cartinhas: 17,
          total_apadrinhadas: 10,
          total_entregues: 4,
          total_instituicoes: 2,
        },
      ]])
      .mockResolvedValueOnce([{ affectedRows: 1 }]);

    const res = await finalizarCampanha();

    expect(res.success).toBe(true);
    expect(mockDb.query).toHaveBeenNthCalledWith(
      2,
      expect.stringMatching(/FROM cartinhas WHERE campanha_id = \?/i),
      [3],
    );
    expect(mockDb.query).toHaveBeenNthCalledWith(
      3,
      expect.stringMatching(/UPDATE campanhas/i),
      [17, 10, 4, 2, 3],
    );
  });

  it("usa zero como padrão quando os agregados de apadrinhadas/entregues vêm nulos (nenhuma cartinha na campanha)", async () => {
    mockPermissao.mockResolvedValue({ ok: true, usuario: usuarioFake });
    mockDb.query
      .mockResolvedValueOnce([[{ id: 3 }]])
      .mockResolvedValueOnce([[
        {
          total_cartinhas: 0,
          total_apadrinhadas: null,
          total_entregues: null,
          total_instituicoes: 0,
        },
      ]])
      .mockResolvedValueOnce([{ affectedRows: 1 }]);

    const res = await finalizarCampanha();

    expect(res.success).toBe(true);
    expect(mockDb.query).toHaveBeenNthCalledWith(
      3,
      expect.stringMatching(/UPDATE campanhas/i),
      [0, 0, 0, 0, 3],
    );
  });

  it("retorna erro genérico quando o banco falha", async () => {
    mockPermissao.mockResolvedValue({ ok: true, usuario: usuarioFake });
    mockDb.query.mockRejectedValue(new Error("conexão perdida"));

    const res = await finalizarCampanha();

    expect(res.success).toBe(false);
  });
});
