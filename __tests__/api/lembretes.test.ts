import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/db", () => ({ default: { query: vi.fn() } }));
vi.mock("@/lib/email", () => ({ enviarLembreteEntrega: vi.fn() }));

import db from "@/lib/db";
import { enviarLembreteEntrega } from "@/lib/email";
import { GET } from "@/app/api/cron/lembretes/route";

const mockQuery = (db as unknown as { query: ReturnType<typeof vi.fn> }).query;
const mockEmail = vi.mocked(enviarLembreteEntrega);

function chamar(autorizado = true) {
  return GET(
    new NextRequest("http://localhost/api/cron/lembretes", {
      headers: autorizado ? { authorization: "Bearer segredo-teste" } : {},
    }),
  );
}

function cartinha(id: number, extra: Record<string, unknown> = {}) {
  return {
    id,
    nome_crianca: `Crianca${id}`,
    presente_pedido: `Presente${id}`,
    data_limite_entrega: "2026-12-10",
    numero_sequencial: id * 10,
    padrinho_nome: `Padrinho${id}`,
    padrinho_email: `p${id}@teste.com`,
    ...extra,
  };
}

// 1ª consulta = prazo em 10 dias; 2ª = prazo vencido.
function bancoCom(em10dias: unknown[], vencidas: unknown[]) {
  mockQuery.mockResolvedValueOnce([em10dias]).mockResolvedValueOnce([vencidas]);
}

beforeEach(() => {
  process.env.CRON_SECRET = "segredo-teste";
  mockQuery.mockReset();
  mockEmail.mockReset();
  mockEmail.mockResolvedValue({ ok: true } as never);
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  delete process.env.CRON_SECRET;
  vi.restoreAllMocks();
});

describe("GET /api/cron/lembretes — autorização", () => {
  it("recusa sem o segredo, sem consultar o banco nem enviar e-mail", async () => {
    const res = await chamar(false);
    expect(res.status).toBe(401);
    expect(await res.text()).toBe("Unauthorized");
    expect(mockQuery).not.toHaveBeenCalled();
    expect(mockEmail).not.toHaveBeenCalled();
  });

  it("recusa quando CRON_SECRET não está configurado", async () => {
    delete process.env.CRON_SECRET;
    const res = await chamar(true);
    expect(res.status).toBe(401);
    expect(mockQuery).not.toHaveBeenCalled();
  });
});

describe("GET /api/cron/lembretes — quem recebe lembrete", () => {
  it("as duas consultas excluem cartinhas conferida, embrulhado, entregue e cancelada", async () => {
    bancoCom([], []);
    await chamar();
    expect(mockQuery).toHaveBeenCalledTimes(2);
    for (const [sql] of mockQuery.mock.calls) {
      expect(String(sql)).toMatch(
        /c\.status NOT IN \('conferida', 'embrulhado', 'entregue', 'cancelada'\)/,
      );
    }
  });

  it("a 1ª consulta pega prazo em exatamente 10 dias e ainda sem lembrete '10d'", async () => {
    bancoCom([], []);
    await chamar();
    const sql = String(mockQuery.mock.calls[0][0]);
    expect(sql).toContain("DATEDIFF(c.data_limite_entrega, CURDATE()) = 10");
    expect(sql).toContain("le.tipo = '10d'");
    expect(sql).toContain("le.id IS NULL");
  });

  it("a 2ª consulta pega prazo vencido e ainda sem lembrete 'vencido'", async () => {
    bancoCom([], []);
    await chamar();
    const sql = String(mockQuery.mock.calls[1][0]);
    expect(sql).toContain("c.data_limite_entrega < CURDATE()");
    expect(sql).toContain("le.tipo = 'vencido'");
    expect(sql).toContain("le.id IS NULL");
  });

  it("junta o padrinho pela cartinha apadrinhada", async () => {
    bancoCom([], []);
    await chamar();
    for (const [sql] of mockQuery.mock.calls) {
      expect(String(sql)).toContain("c.apadrinhado_por_usuario_id = u.id");
    }
  });
});

describe("GET /api/cron/lembretes — envio", () => {
  it("sem cartinhas, não envia nada e responde zeros", async () => {
    bancoCom([], []);
    const res = await chamar();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, em10dias: 0, vencidas: 0, enviados: 0, falhas: 0 });
    expect(mockEmail).not.toHaveBeenCalled();
  });

  it("envia ao padrinho com os dados da cartinha e o tipo certo", async () => {
    bancoCom([cartinha(1)], []);
    await chamar();
    expect(mockEmail).toHaveBeenCalledTimes(1);
    expect(mockEmail).toHaveBeenCalledWith({
      nomePadrinho: "Padrinho1",
      emailPadrinho: "p1@teste.com",
      nomeCrianca: "Crianca1",
      presentePedido: "Presente1",
      dataLimite: "2026-12-10",
      numeroSequencial: 10,
      tipo: "10d",
    });
  });

  it("o lote de prazo vencido usa o tipo 'vencido'", async () => {
    bancoCom([], [cartinha(2)]);
    await chamar();
    expect(mockEmail.mock.calls[0][0]).toMatchObject({ tipo: "vencido", emailPadrinho: "p2@teste.com" });
  });

  it("envia primeiro os de 10 dias e depois os vencidos", async () => {
    bancoCom([cartinha(1)], [cartinha(2)]);
    await chamar();
    expect(mockEmail.mock.calls.map((c) => c[0].tipo)).toEqual(["10d", "vencido"]);
  });

  it("registra o lembrete enviado, para não repetir no dia seguinte", async () => {
    bancoCom([cartinha(1)], [cartinha(2)]);
    await chamar();
    const inserts = mockQuery.mock.calls.filter(([sql]) =>
      String(sql).includes("INSERT IGNORE INTO lembretes_enviados"),
    );
    expect(inserts.map((c) => c[1])).toEqual([[1, "10d"], [2, "vencido"]]);
  });

  it("e-mail que falha não é registrado (será tentado de novo amanhã) e conta como falha", async () => {
    bancoCom([cartinha(1), cartinha(2)], []);
    mockEmail.mockResolvedValueOnce({ ok: false } as never).mockResolvedValueOnce({ ok: true } as never);
    const res = await chamar();

    const inserts = mockQuery.mock.calls.filter(([sql]) => String(sql).includes("INSERT IGNORE"));
    expect(inserts).toHaveLength(1);
    expect(inserts[0][1]).toEqual([2, "10d"]);

    expect(await res.json()).toEqual({ ok: true, em10dias: 2, vencidas: 0, enviados: 1, falhas: 1 });
  });

  it("uma falha de envio não interrompe o restante do lote", async () => {
    bancoCom([cartinha(1), cartinha(2), cartinha(3)], []);
    mockEmail.mockResolvedValueOnce({ ok: false } as never);
    await chamar();
    expect(mockEmail).toHaveBeenCalledTimes(3);
  });

  it("totaliza enviados e falhas dos dois lotes", async () => {
    bancoCom([cartinha(1), cartinha(2)], [cartinha(3), cartinha(4), cartinha(5)]);
    mockEmail
      .mockResolvedValueOnce({ ok: true } as never)
      .mockResolvedValueOnce({ ok: false } as never)
      .mockResolvedValueOnce({ ok: true } as never)
      .mockResolvedValueOnce({ ok: true } as never)
      .mockResolvedValueOnce({ ok: false } as never);
    const res = await chamar();
    expect(await res.json()).toEqual({ ok: true, em10dias: 2, vencidas: 3, enviados: 3, falhas: 2 });
  });

  it("registra no log o resumo do dia", async () => {
    bancoCom([cartinha(1)], []);
    await chamar();
    expect(console.log).toHaveBeenCalledWith("[cron/lembretes] enviados=1 falhas=0");
  });
});

describe("GET /api/cron/lembretes — erros", () => {
  it("falha no banco devolve 500 genérico, sem vazar detalhes, e não envia e-mail", async () => {
    mockQuery.mockRejectedValueOnce(new Error("ER_ACCESS_DENIED usuario=segredo"));
    const res = await chamar();
    expect(res.status).toBe(500);
    expect(await res.text()).toBe("Erro interno");
    expect(mockEmail).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledWith("[cron/lembretes] erro:", expect.any(Error));
  });

  it("falha ao registrar o lembrete devolve 500", async () => {
    bancoCom([cartinha(1)], []);
    mockQuery.mockRejectedValueOnce(new Error("falhou o insert"));
    const res = await chamar();
    expect(res.status).toBe(500);
  });
});
