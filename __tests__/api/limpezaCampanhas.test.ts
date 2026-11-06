import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/db", () => ({ default: { query: vi.fn() } }));
vi.mock("@/lib/rateLimit", () => ({ limparContadoresAntigos: vi.fn() }));
vi.mock("@/lib/cloudinary", () => ({ apagarImagens: vi.fn() }));

import db from "@/lib/db";
import { limparContadoresAntigos } from "@/lib/rateLimit";
import { apagarImagens } from "@/lib/cloudinary";
import { GET } from "@/app/api/cron/limpeza-campanhas/route";

const mockQuery = (db as unknown as { query: ReturnType<typeof vi.fn> }).query;
const mockLimparContadores = vi.mocked(limparContadoresAntigos);
const mockApagarImagens = vi.mocked(apagarImagens);

function chamar(autorizado = true, query = "") {
  return GET(
    new NextRequest(`http://localhost/api/cron/limpeza-campanhas${query}`, {
      headers: autorizado ? { authorization: "Bearer segredo-teste" } : {},
    }),
  );
}

// Respostas do banco para UMA campanha limpa de verdade, na ordem em que a rota consulta:
// fotos -> DELETE desistencias -> DELETE cartinhas -> UPDATE campanha.
function mockCampanhaLimpa({
  fotos = [] as Array<{ foto_cartinha: string }>,
  desistencias = 0,
  cartinhas = 0,
} = {}) {
  mockQuery
    .mockResolvedValueOnce([fotos])
    .mockResolvedValueOnce([{ affectedRows: desistencias }])
    .mockResolvedValueOnce([{ affectedRows: cartinhas }])
    .mockResolvedValueOnce([{}]);
}

// Respostas para UMA campanha em simulação: fotos -> COUNT desistencias -> COUNT cartinhas.
function mockCampanhaSimulada({
  fotos = [] as Array<{ foto_cartinha: string }>,
  desistencias = 0,
  cartinhas = 0,
} = {}) {
  mockQuery
    .mockResolvedValueOnce([fotos])
    .mockResolvedValueOnce([[{ total: desistencias }]])
    .mockResolvedValueOnce([[{ total: cartinhas }]]);
}

const sqlsExecutados = () => mockQuery.mock.calls.map(([sql]) => String(sql));

beforeEach(() => {
  process.env.CRON_SECRET = "segredo-teste";
  mockQuery.mockReset();
  mockLimparContadores.mockReset();
  mockLimparContadores.mockResolvedValue(undefined);
  mockApagarImagens.mockReset();
  mockApagarImagens.mockResolvedValue({ apagadas: 0, falhas: 0 });
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  delete process.env.CRON_SECRET;
  vi.restoreAllMocks();
});

describe("GET /api/cron/limpeza-campanhas — autorização", () => {
  it("recusa sem o segredo, sem tocar em nenhum dado", async () => {
    const res = await chamar(false);
    expect(res.status).toBe(401);
    expect(await res.text()).toBe("Unauthorized");
    expect(mockQuery).not.toHaveBeenCalled();
    expect(mockLimparContadores).not.toHaveBeenCalled();
  });

  it("recusa a simulação também sem o segredo", async () => {
    const res = await chamar(false, "?dry=1");
    expect(res.status).toBe(401);
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it("recusa quando CRON_SECRET não está configurado", async () => {
    delete process.env.CRON_SECRET;
    const res = await chamar(true);
    expect(res.status).toBe(401);
    expect(mockQuery).not.toHaveBeenCalled();
  });
});

describe("GET /api/cron/limpeza-campanhas — retenção (LGPD)", () => {
  it("só seleciona campanhas encerradas há mais de 6 meses e ainda não limpas", async () => {
    mockQuery.mockResolvedValueOnce([[]]);
    await chamar();
    const sql = String(mockQuery.mock.calls[0][0]);
    expect(sql).toContain("FROM campanhas");
    expect(sql).toContain("data_encerramento IS NOT NULL");
    expect(sql).toContain("data_encerramento < DATE_SUB(NOW(), INTERVAL 6 MONTH)");
    expect(sql).toContain("dados_removidos_em IS NULL");
  });

  it("sem campanhas vencidas, não apaga nada (nem desistências)", async () => {
    mockQuery.mockResolvedValueOnce([[]]);
    const res = await chamar();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      ok: true,
      campanhasLimpas: [],
      cartinhasRemovidas: 0,
      desistenciasRemovidas: 0,
      imagensApagadas: 0,
      imagensComFalha: 0,
    });
    expect(mockQuery).toHaveBeenCalledTimes(1);
  });

  it("segue a ordem: fotos, desistências, cartinhas e só então marca a campanha como limpa", async () => {
    mockQuery.mockResolvedValueOnce([[{ id: 7, ano: 2025 }]]);
    mockCampanhaLimpa({ fotos: [{ foto_cartinha: "https://res.cloudinary.com/x/image/upload/v1/a.jpg" }], desistencias: 3, cartinhas: 12 });
    await chamar();

    const [, sqlFotos, sqlDesistencias, sqlCartinhas, sqlUpdate] = sqlsExecutados();
    expect(sqlFotos).toContain("SELECT foto_cartinha FROM cartinhas WHERE campanha_id = ?");
    expect(sqlDesistencias).toContain("DELETE FROM desistencias");
    expect(sqlCartinhas).toBe("DELETE FROM cartinhas WHERE campanha_id = ?");
    expect(sqlUpdate).toBe("UPDATE campanhas SET dados_removidos_em = NOW() WHERE id = ?");

    expect(mockQuery.mock.calls[3][1]).toEqual([7]);
    expect(mockQuery.mock.calls[4][1]).toEqual([7]);
  });

  it("apaga as desistências pelas cartinhas da campanha, sem depender da FK", async () => {
    mockQuery.mockResolvedValueOnce([[{ id: 7, ano: 2025 }]]);
    mockCampanhaLimpa({ desistencias: 2, cartinhas: 5 });
    await chamar();

    const [sql, params] = mockQuery.mock.calls[2];
    expect(String(sql).replace(/\s+/g, " ")).toBe(
      "DELETE FROM desistencias WHERE cartinha_id IN (SELECT id FROM cartinhas WHERE campanha_id = ?)",
    );
    expect(params).toEqual([7]);
    // Nunca por idade: o histórico fica até a limpeza da própria campanha.
    expect(sqlsExecutados().some((q) => q.includes("data_desistencia"))).toBe(false);
  });

  it("as desistências são apagadas antes das cartinhas (ordem das chamadas)", async () => {
    mockQuery.mockResolvedValueOnce([[{ id: 7, ano: 2025 }]]);
    mockCampanhaLimpa({ desistencias: 1, cartinhas: 1 });
    await chamar();

    const sqls = sqlsExecutados();
    const iDesistencias = sqls.findIndex((q) => q.includes("DELETE FROM desistencias"));
    const iCartinhas = sqls.findIndex((q) => q.includes("DELETE FROM cartinhas"));
    expect(iDesistencias).toBeGreaterThan(0);
    expect(iDesistencias).toBeLessThan(iCartinhas);
  });

  it("totaliza cartinhas e desistências removidas e lista os anos das campanhas limpas", async () => {
    mockQuery.mockResolvedValueOnce([[{ id: 1, ano: 2024 }, { id: 2, ano: 2025 }]]);
    mockCampanhaLimpa({ desistencias: 4, cartinhas: 30 });
    mockCampanhaLimpa({ desistencias: 1, cartinhas: 12 });
    const res = await chamar();
    expect(await res.json()).toEqual({
      ok: true,
      campanhasLimpas: [2024, 2025],
      cartinhasRemovidas: 42,
      desistenciasRemovidas: 5,
      imagensApagadas: 0,
      imagensComFalha: 0,
    });
  });

  it("se apagar as desistências falhar, não apaga as cartinhas, NÃO marca a campanha e devolve 500", async () => {
    mockQuery
      .mockResolvedValueOnce([[{ id: 7, ano: 2025 }]])
      .mockResolvedValueOnce([[]])
      .mockRejectedValueOnce(new Error("falha ao apagar desistencias"));
    const res = await chamar();
    expect(res.status).toBe(500);
    const sqls = sqlsExecutados();
    expect(sqls.some((q) => q.includes("DELETE FROM cartinhas"))).toBe(false);
    expect(sqls.some((q) => q.includes("UPDATE campanhas"))).toBe(false);
  });

  it("se apagar as cartinhas falhar, NÃO marca a campanha como limpa e devolve 500", async () => {
    mockQuery
      .mockResolvedValueOnce([[{ id: 7, ano: 2025 }]])
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([{ affectedRows: 0 }])
      .mockRejectedValueOnce(new Error("falha ao apagar"));
    const res = await chamar();
    expect(res.status).toBe(500);
    expect(sqlsExecutados().some((q) => q.includes("UPDATE campanhas"))).toBe(false);
  });

  it("registra no log o resumo da limpeza", async () => {
    mockQuery.mockResolvedValueOnce([[{ id: 1, ano: 2024 }]]);
    mockCampanhaLimpa({ desistencias: 2, cartinhas: 5 });
    await chamar();
    expect(console.log).toHaveBeenCalledWith(
      "[cron/limpeza-campanhas] campanhas=1 cartinhas_removidas=5 desistencias_removidas=2 imagens_apagadas=0 imagens_com_falha=0",
    );
  });
});

describe("GET /api/cron/limpeza-campanhas — contadores de rate limit", () => {
  it("aproveita o cron para limpar contadores antigos", async () => {
    mockQuery.mockResolvedValueOnce([[]]);
    await chamar();
    expect(mockLimparContadores).toHaveBeenCalledTimes(1);
  });

  it("falha ao limpar contadores não impede a limpeza das campanhas", async () => {
    mockLimparContadores.mockRejectedValueOnce(new Error("tabela ausente"));
    mockQuery.mockResolvedValueOnce([[{ id: 3, ano: 2024 }]]);
    mockCampanhaLimpa({ cartinhas: 4 });
    const res = await chamar();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      ok: true,
      campanhasLimpas: [2024],
      cartinhasRemovidas: 4,
      desistenciasRemovidas: 0,
      imagensApagadas: 0,
      imagensComFalha: 0,
    });
    expect(console.error).toHaveBeenCalledWith("Falha ao limpar rate_limit:", expect.any(Error));
  });
});

describe("GET /api/cron/limpeza-campanhas — imagens no Cloudinary", () => {
  const fotos = [
    { foto_cartinha: "https://res.cloudinary.com/demo/image/upload/v1/a.jpg" },
    { foto_cartinha: "https://res.cloudinary.com/demo/image/upload/v1/b.jpg" },
  ];

  it("lê as fotos da campanha e apaga as imagens ANTES de apagar desistências e cartinhas", async () => {
    mockQuery.mockResolvedValueOnce([[{ id: 7, ano: 2025 }]]);
    mockCampanhaLimpa({ fotos, desistencias: 1, cartinhas: 2 });
    mockApagarImagens.mockResolvedValueOnce({ apagadas: 2, falhas: 0 });

    const res = await chamar();

    const [sqlFotos, paramsFotos] = mockQuery.mock.calls[1];
    expect(String(sqlFotos)).toContain("SELECT foto_cartinha FROM cartinhas WHERE campanha_id = ?");
    expect(String(sqlFotos)).toContain("foto_cartinha IS NOT NULL");
    expect(paramsFotos).toEqual([7]);
    expect(mockApagarImagens).toHaveBeenCalledWith(fotos.map((f) => f.foto_cartinha));

    const ordemApagarImagens = mockApagarImagens.mock.invocationCallOrder[0];
    const ordemDeleteDesistencias = mockQuery.mock.invocationCallOrder[2];
    expect(ordemApagarImagens).toBeLessThan(ordemDeleteDesistencias);
    expect(String(mockQuery.mock.calls[2][0])).toContain("DELETE FROM desistencias");

    expect(await res.json()).toMatchObject({ imagensApagadas: 2, imagensComFalha: 0 });
  });

  it("falha no Cloudinary não impede apagar desistências, cartinhas nem marcar a campanha", async () => {
    mockQuery.mockResolvedValueOnce([[{ id: 7, ano: 2025 }]]);
    mockCampanhaLimpa({ fotos, desistencias: 1, cartinhas: 2 });
    mockApagarImagens.mockResolvedValueOnce({ apagadas: 0, falhas: 2 });

    const res = await chamar();

    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({
      cartinhasRemovidas: 2,
      desistenciasRemovidas: 1,
      imagensApagadas: 0,
      imagensComFalha: 2,
    });
    const sqls = sqlsExecutados();
    expect(sqls.some((q) => q.includes("DELETE FROM desistencias"))).toBe(true);
    expect(sqls.some((q) => q.includes("DELETE FROM cartinhas"))).toBe(true);
    expect(sqls.some((q) => q.includes("UPDATE campanhas"))).toBe(true);
  });
});

describe("GET /api/cron/limpeza-campanhas?dry=1 — simulação", () => {
  const fotos = [
    { foto_cartinha: "https://res.cloudinary.com/demo/image/upload/v1/a.jpg" },
    { foto_cartinha: "https://res.cloudinary.com/demo/image/upload/v1/b.jpg" },
    { foto_cartinha: "https://res.cloudinary.com/demo/image/upload/v1/c.jpg" },
  ];

  it("só conta: não apaga imagens, desistências, cartinhas nem marca a campanha", async () => {
    mockQuery.mockResolvedValueOnce([[{ id: 7, ano: 2025 }]]);
    mockCampanhaSimulada({ fotos, desistencias: 4, cartinhas: 20 });

    const res = await chamar(true, "?dry=1");

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      ok: true,
      simulacao: true,
      campanhasLimpas: [2025],
      cartinhasRemovidas: 20,
      desistenciasRemovidas: 4,
      imagensApagadas: 3,
      imagensComFalha: 0,
    });

    const sqls = sqlsExecutados();
    expect(sqls.some((q) => /^\s*(DELETE|UPDATE|INSERT)/i.test(q))).toBe(false);
    expect(mockApagarImagens).not.toHaveBeenCalled();
    expect(mockLimparContadores).not.toHaveBeenCalled();
  });

  it("conta as desistências pelas cartinhas da campanha, igual à limpeza real", async () => {
    mockQuery.mockResolvedValueOnce([[{ id: 7, ano: 2025 }]]);
    mockCampanhaSimulada({ desistencias: 2, cartinhas: 5 });
    await chamar(true, "?dry=1");

    const [sql, params] = mockQuery.mock.calls[2];
    expect(String(sql).replace(/\s+/g, " ")).toBe(
      "SELECT COUNT(*) AS total FROM desistencias WHERE cartinha_id IN (SELECT id FROM cartinhas WHERE campanha_id = ?)",
    );
    expect(params).toEqual([7]);
  });

  it("totaliza várias campanhas e marca no log que foi simulação", async () => {
    mockQuery.mockResolvedValueOnce([[{ id: 1, ano: 2024 }, { id: 2, ano: 2025 }]]);
    mockCampanhaSimulada({ desistencias: 1, cartinhas: 10 });
    mockCampanhaSimulada({ desistencias: 2, cartinhas: 5 });
    const res = await chamar(true, "?dry=1");

    expect(await res.json()).toMatchObject({ cartinhasRemovidas: 15, desistenciasRemovidas: 3 });
    expect(console.log).toHaveBeenCalledWith(
      "[cron/limpeza-campanhas] SIMULACAO campanhas=2 cartinhas_removidas=15 desistencias_removidas=3 imagens_apagadas=0 imagens_com_falha=0",
    );
  });

  it("só dry=1 liga a simulação: outros valores executam a limpeza de verdade", async () => {
    mockQuery.mockResolvedValueOnce([[{ id: 7, ano: 2025 }]]);
    mockCampanhaLimpa({ cartinhas: 1 });
    await chamar(true, "?dry=0");
    expect(sqlsExecutados().some((q) => q.includes("DELETE FROM cartinhas"))).toBe(true);
  });
});

describe("GET /api/cron/limpeza-campanhas — erros", () => {
  it("falha ao buscar campanhas devolve 500 genérico, sem vazar detalhes", async () => {
    mockQuery.mockRejectedValueOnce(new Error("ER_ACCESS_DENIED usuario=segredo"));
    const res = await chamar();
    expect(res.status).toBe(500);
    expect(await res.text()).toBe("Erro interno");
    expect(console.error).toHaveBeenCalledWith("[cron/limpeza-campanhas] erro:", expect.any(Error));
  });
});
