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

function chamar(autorizado = true) {
  return GET(
    new NextRequest("http://localhost/api/cron/limpeza-campanhas", {
      headers: autorizado ? { authorization: "Bearer segredo-teste" } : {},
    }),
  );
}

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

  it("sem campanhas vencidas, não apaga nada", async () => {
    mockQuery.mockResolvedValueOnce([[]]);
    const res = await chamar();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, campanhasLimpas: [], cartinhasRemovidas: 0, imagensApagadas: 0, imagensComFalha: 0 });
    expect(mockQuery).toHaveBeenCalledTimes(1);
  });

  it("apaga as cartinhas da campanha e só então marca a campanha como limpa", async () => {
    mockQuery
      .mockResolvedValueOnce([[{ id: 7, ano: 2025 }]])
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([{ affectedRows: 12 }])
      .mockResolvedValueOnce([{}]);
    await chamar();

    const [sqlDelete, paramsDelete] = mockQuery.mock.calls[2];
    expect(String(sqlDelete)).toBe("DELETE FROM cartinhas WHERE campanha_id = ?");
    expect(paramsDelete).toEqual([7]);

    const [sqlUpdate, paramsUpdate] = mockQuery.mock.calls[3];
    expect(String(sqlUpdate)).toBe("UPDATE campanhas SET dados_removidos_em = NOW() WHERE id = ?");
    expect(paramsUpdate).toEqual([7]);
  });

  it("totaliza as cartinhas removidas e lista os anos das campanhas limpas", async () => {
    mockQuery
      .mockResolvedValueOnce([[{ id: 1, ano: 2024 }, { id: 2, ano: 2025 }]])
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([{ affectedRows: 30 }])
      .mockResolvedValueOnce([{}])
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([{ affectedRows: 12 }])
      .mockResolvedValueOnce([{}]);
    const res = await chamar();
    expect(await res.json()).toEqual({ ok: true, campanhasLimpas: [2024, 2025], cartinhasRemovidas: 42, imagensApagadas: 0, imagensComFalha: 0 });
  });

  it("se apagar as cartinhas falhar, NÃO marca a campanha como limpa", async () => {
    mockQuery
      .mockResolvedValueOnce([[{ id: 7, ano: 2025 }]])
      .mockResolvedValueOnce([[]])
      .mockRejectedValueOnce(new Error("falha ao apagar"));
    const res = await chamar();
    expect(res.status).toBe(500);
    const marcou = mockQuery.mock.calls.some(([sql]) => String(sql).includes("UPDATE campanhas"));
    expect(marcou).toBe(false);
  });

  it("registra no log o resumo da limpeza", async () => {
    mockQuery
      .mockResolvedValueOnce([[{ id: 1, ano: 2024 }]])
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([{ affectedRows: 5 }])
      .mockResolvedValueOnce([{}]);
    await chamar();
    expect(console.log).toHaveBeenCalledWith(
      "[cron/limpeza-campanhas] campanhas=1 cartinhas_removidas=5 imagens_apagadas=0 imagens_com_falha=0",
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
    mockQuery
      .mockResolvedValueOnce([[{ id: 3, ano: 2024 }]])
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([{ affectedRows: 4 }])
      .mockResolvedValueOnce([{}]);
    const res = await chamar();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, campanhasLimpas: [2024], cartinhasRemovidas: 4, imagensApagadas: 0, imagensComFalha: 0 });
    expect(console.error).toHaveBeenCalledWith("Falha ao limpar rate_limit:", expect.any(Error));
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

describe("GET /api/cron/limpeza-campanhas — imagens no Cloudinary", () => {
  const fotos = [
    { foto_cartinha: "https://res.cloudinary.com/demo/image/upload/v1/a.jpg" },
    { foto_cartinha: "https://res.cloudinary.com/demo/image/upload/v1/b.jpg" },
  ];

  it("lê as fotos da campanha e apaga as imagens ANTES de apagar as cartinhas", async () => {
    mockQuery
      .mockResolvedValueOnce([[{ id: 7, ano: 2025 }]])
      .mockResolvedValueOnce([fotos])
      .mockResolvedValueOnce([{ affectedRows: 2 }])
      .mockResolvedValueOnce([{}]);
    mockApagarImagens.mockResolvedValueOnce({ apagadas: 2, falhas: 0 });

    const res = await chamar();

    const [sqlFotos, paramsFotos] = mockQuery.mock.calls[1];
    expect(String(sqlFotos)).toContain("SELECT foto_cartinha FROM cartinhas WHERE campanha_id = ?");
    expect(String(sqlFotos)).toContain("foto_cartinha IS NOT NULL");
    expect(paramsFotos).toEqual([7]);
    expect(mockApagarImagens).toHaveBeenCalledWith(fotos.map((f) => f.foto_cartinha));

    const ordemApagarImagens = mockApagarImagens.mock.invocationCallOrder[0];
    const ordemDelete = mockQuery.mock.invocationCallOrder[2];
    expect(ordemApagarImagens).toBeLessThan(ordemDelete);
    expect(String(mockQuery.mock.calls[2][0])).toContain("DELETE FROM cartinhas");

    expect(await res.json()).toMatchObject({ imagensApagadas: 2, imagensComFalha: 0 });
  });

  it("falha no Cloudinary não impede apagar as cartinhas nem marcar a campanha", async () => {
    mockQuery
      .mockResolvedValueOnce([[{ id: 7, ano: 2025 }]])
      .mockResolvedValueOnce([fotos])
      .mockResolvedValueOnce([{ affectedRows: 2 }])
      .mockResolvedValueOnce([{}]);
    mockApagarImagens.mockResolvedValueOnce({ apagadas: 0, falhas: 2 });

    const res = await chamar();

    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ cartinhasRemovidas: 2, imagensApagadas: 0, imagensComFalha: 2 });
    const sqls = mockQuery.mock.calls.map(([sql]) => String(sql));
    expect(sqls.some((q) => q.includes("DELETE FROM cartinhas"))).toBe(true);
    expect(sqls.some((q) => q.includes("UPDATE campanhas"))).toBe(true);
  });
});
