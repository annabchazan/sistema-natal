import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  default: {
    query: vi.fn(),
    getConnection: vi.fn(),
  },
}));

vi.mock("@/lib/auth", () => ({
  getUsuarioAutenticado: vi.fn(),
  validarPermissaoAdmin: vi.fn(),
}));

vi.mock("@/lib/email", () => ({
  enviarConfirmacaoApadrinhamento: vi.fn().mockResolvedValue({ ok: true }),
  enviarNotificacaoEntrega: vi.fn().mockResolvedValue({ ok: true }),
  enviarCancelamentoApadrinamento: vi.fn().mockResolvedValue({ ok: true }),
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import db from "@/lib/db";
import { getUsuarioAutenticado } from "@/lib/auth";
import { enviarConfirmacaoApadrinhamento, enviarCancelamentoApadrinamento } from "@/lib/email";
import { finalizarApadrinamento, cancelarApadrinamento } from "@/app/actions/cartinhas";

const mockDb = db as unknown as {
  query: ReturnType<typeof vi.fn>;
  getConnection: ReturnType<typeof vi.fn>;
};
const mockGetUsuario = vi.mocked(getUsuarioAutenticado);
const mockEnviarConfirmacao = vi.mocked(enviarConfirmacaoApadrinhamento);
const mockEnviarCancelamento = vi.mocked(enviarCancelamentoApadrinamento);

const usuarioFake = {
  id: 1,
  nome: "Padrinho Teste",
  telefone: "21999999999",
  email: "padrinho@teste.com",
  tipo: "padrinho" as const,
  admin_role: null,
};

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

beforeEach(() => {
  vi.resetAllMocks();
});

// ─── finalizarApadrinamento ───────────────────────────────────────────────────

describe("finalizarApadrinamento", () => {
  it("rejeita quando usuário não está logado", async () => {
    mockGetUsuario.mockResolvedValue(null);
    const res = await finalizarApadrinamento([1]);
    expect(res.success).toBe(false);
    expect(res.message).toMatch(/logado/i);
  });

  it("rejeita lista vazia", async () => {
    mockGetUsuario.mockResolvedValue(usuarioFake);
    const res = await finalizarApadrinamento([]);
    expect(res.success).toBe(false);
    expect(res.message).toMatch(/nenhuma/i);
  });

  it("rejeita mais de 20 cartinhas por vez", async () => {
    mockGetUsuario.mockResolvedValue(usuarioFake);
    const ids = Array.from({ length: 21 }, (_, i) => i + 1);
    const res = await finalizarApadrinamento(ids);
    expect(res.success).toBe(false);
    expect(res.message).toMatch(/20/);
  });

  it("rejeita se alguma cartinha já foi apadrinhada por outra pessoa", async () => {
    mockGetUsuario.mockResolvedValue(usuarioFake);
    // SELECT de disponíveis retorna menos do que o solicitado
    const conn = mockConexao([
      [[{ id: 1 }]], // só 1 disponível, pedimos 2
    ]);
    const res = await finalizarApadrinamento([1, 2]);
    expect(res.success).toBe(false);
    expect(res.message).toMatch(/já foram apadrinhadas/i);
    expect(conn.rollback).toHaveBeenCalled();
  });

  it("apadrinha com sucesso quando tudo está disponível", async () => {
    mockGetUsuario.mockResolvedValue(usuarioFake);
    mockEnviarConfirmacao.mockResolvedValue({ ok: true });
    mockConexao([
      [[{ id: 1 }, { id: 2 }]], // SELECT disponíveis — 2 cartinhas OK
      [{ affectedRows: 2 }],    // UPDATE
    ]);
    // db.query usado após commit (busca dados para e-mail)
    mockDb.query
      .mockResolvedValueOnce([[
        { nome_crianca: "Ana", presente_pedido: "Boneca", data_limite_entrega: null, numero_sequencial: 1 },
        { nome_crianca: "Pedro", presente_pedido: "Bola", data_limite_entrega: null, numero_sequencial: 2 },
      ]])
      .mockResolvedValueOnce([[{ nome: "Padrinho Teste", email: "padrinho@teste.com" }]]);

    const res = await finalizarApadrinamento([1, 2]);
    expect(res.success).toBe(true);
    expect(res.message).toMatch(/2 cartinhas/i);
  });
});

// ─── cancelarApadrinamento ───────────────────────────────────────────────────

describe("cancelarApadrinamento", () => {
  it("rejeita quando usuário não está logado", async () => {
    mockGetUsuario.mockResolvedValue(null);
    const res = await cancelarApadrinamento(1);
    expect(res.success).toBe(false);
    expect(res.message).toMatch(/logado/i);
  });

  it("rejeita quando cartinha não pertence ao usuário ou status não é apadrinhada", async () => {
    mockGetUsuario.mockResolvedValue(usuarioFake);
    // SELECT retorna vazio — cartinha não encontrada com os critérios
    mockDb.query.mockResolvedValue([[]]);
    const res = await cancelarApadrinamento(99);
    expect(res.success).toBe(false);
    expect(res.message).toMatch(/não foi possível cancelar/i);
  });

  it("cancela e volta status para disponivel quando tudo ok", async () => {
    mockGetUsuario.mockResolvedValue(usuarioFake);
    mockEnviarCancelamento.mockResolvedValue({ ok: true });
    mockDb.query
      .mockResolvedValueOnce([[{ id: 1 }]])      // SELECT — cartinha encontrada
      .mockResolvedValueOnce([{ affectedRows: 1 }]); // UPDATE
    const res = await cancelarApadrinamento(1);
    expect(res.success).toBe(true);
    expect(res.message).toMatch(/cancelado/i);
  });
});
