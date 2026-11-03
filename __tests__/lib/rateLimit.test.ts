import { describe, it, expect, vi, beforeEach } from "vitest";

let cabecalhos: Record<string, string> = {};
let headersFalha = false;

vi.mock("next/headers", () => ({
  headers: async () => {
    if (headersFalha) throw new Error("fora de uma requisição");
    return { get: (nome: string) => cabecalhos[nome] ?? null };
  },
}));

vi.mock("@/lib/db", () => ({
  default: { query: vi.fn() },
}));

import db from "@/lib/db";
import { dentroDoLimite, ipDaRequisicao, limparContadoresAntigos } from "@/lib/rateLimit";

const mockQuery = (db as unknown as { query: ReturnType<typeof vi.fn> }).query;

// Simula o banco: 1ª consulta (INSERT ... ON DUPLICATE) e 2ª (SELECT da contagem).
function bancoComContagem(contagem: unknown) {
  mockQuery.mockReset();
  mockQuery.mockResolvedValueOnce([{}]).mockResolvedValueOnce([[{ contagem }]]);
}

beforeEach(() => {
  cabecalhos = {};
  headersFalha = false;
  mockQuery.mockReset();
  vi.restoreAllMocks();
});

describe("dentroDoLimite", () => {
  it("permite enquanto a contagem for menor que o máximo", async () => {
    bancoComContagem(1);
    expect(await dentroDoLimite("login:ip:1.2.3.4", 5, 900)).toBe(true);
  });

  it("permite a tentativa exatamente no limite", async () => {
    bancoComContagem(5);
    expect(await dentroDoLimite("login:ip:1.2.3.4", 5, 900)).toBe(true);
  });

  it("bloqueia a primeira tentativa acima do limite", async () => {
    bancoComContagem(6);
    expect(await dentroDoLimite("login:ip:1.2.3.4", 5, 900)).toBe(false);
  });

  it("bloqueia contagens muito acima do limite", async () => {
    bancoComContagem(500);
    expect(await dentroDoLimite("login:ip:1.2.3.4", 5, 900)).toBe(false);
  });

  it("converte a contagem devolvida como texto (o driver pode devolver string)", async () => {
    bancoComContagem("5");
    expect(await dentroDoLimite("k", 5, 60)).toBe(true);
    bancoComContagem("6");
    expect(await dentroDoLimite("k", 5, 60)).toBe(false);
  });

  it("sem linha de contagem, considera a 1ª tentativa", async () => {
    mockQuery.mockResolvedValueOnce([{}]).mockResolvedValueOnce([[]]);
    expect(await dentroDoLimite("k", 1, 60)).toBe(true);
  });

  it("sem linha de contagem e com máximo 0, bloqueia", async () => {
    mockQuery.mockResolvedValueOnce([{}]).mockResolvedValueOnce([[]]);
    expect(await dentroDoLimite("k", 0, 60)).toBe(false);
  });

  it("se o driver não devolver a lista de linhas, trata como 1ª tentativa (sem cair no catch)", async () => {
    mockQuery.mockResolvedValueOnce([{}]).mockResolvedValueOnce([undefined]);
    // máximo 0: se caísse no catch, liberaria (true); o correto é bloquear (1 > 0).
    expect(await dentroDoLimite("k", 0, 60)).toBe(false);
  });

  it("contagem ausente na linha (undefined) vale 1", async () => {
    bancoComContagem(undefined);
    expect(await dentroDoLimite("k", 1, 60)).toBe(true);
  });

  it("grava o contador com a chave e a janela, depois lê a contagem da mesma chave", async () => {
    bancoComContagem(1);
    await dentroDoLimite("cadastro:ip:9.9.9.9", 40, 3600);

    expect(mockQuery).toHaveBeenCalledTimes(2);
    const [sqlEscrita, paramsEscrita] = mockQuery.mock.calls[0];
    expect(String(sqlEscrita)).toContain("INSERT INTO rate_limit");
    expect(String(sqlEscrita)).toContain("ON DUPLICATE KEY UPDATE");
    expect(paramsEscrita).toEqual(["cadastro:ip:9.9.9.9", 3600, 3600]);

    const [sqlLeitura, paramsLeitura] = mockQuery.mock.calls[1];
    expect(String(sqlLeitura)).toContain("SELECT contagem FROM rate_limit WHERE chave = ?");
    expect(paramsLeitura).toEqual(["cadastro:ip:9.9.9.9"]);
  });

  it("a janela expirada reinicia a contagem em 1 e a data da janela", async () => {
    bancoComContagem(1);
    await dentroDoLimite("k", 5, 60);
    const sql = String(mockQuery.mock.calls[0][0]);
    expect(sql).toMatch(/contagem\s*=\s*IF\(janela_inicio < DATE_SUB\(NOW\(\), INTERVAL \? SECOND\), 1, contagem \+ 1\)/);
    expect(sql).toMatch(/janela_inicio\s*=\s*IF\(janela_inicio < DATE_SUB\(NOW\(\), INTERVAL \? SECOND\), NOW\(\), janela_inicio\)/);
  });

  it("corta chaves maiores que 190 caracteres (limite do índice) nas duas consultas", async () => {
    bancoComContagem(1);
    const longa = "x".repeat(300);
    await dentroDoLimite(longa, 5, 60);
    const esperada = "x".repeat(190);
    expect(mockQuery.mock.calls[0][1][0]).toBe(esperada);
    expect(mockQuery.mock.calls[1][1][0]).toBe(esperada);
  });

  it("mantém inteira uma chave de exatamente 190 caracteres", async () => {
    bancoComContagem(1);
    const exata = "y".repeat(190);
    await dentroDoLimite(exata, 5, 60);
    expect(mockQuery.mock.calls[0][1][0]).toBe(exata);
  });

  it("se o banco falhar, libera a requisição (não derruba o site) e registra o erro", async () => {
    const erro = vi.spyOn(console, "error").mockImplementation(() => {});
    mockQuery.mockRejectedValueOnce(new Error("tabela rate_limit não existe"));
    expect(await dentroDoLimite("k", 5, 60)).toBe(true);
    expect(erro).toHaveBeenCalledWith("Falha no rate limit:", expect.any(Error));
  });

  it("se a leitura da contagem falhar, também libera", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mockQuery.mockResolvedValueOnce([{}]).mockRejectedValueOnce(new Error("timeout"));
    expect(await dentroDoLimite("k", 5, 60)).toBe(true);
  });
});

describe("ipDaRequisicao", () => {
  it("usa o primeiro IP de x-forwarded-for", async () => {
    cabecalhos["x-forwarded-for"] = "203.0.113.7, 70.41.3.18, 150.172.238.178";
    expect(await ipDaRequisicao()).toBe("203.0.113.7");
  });

  it("remove espaços ao redor do IP", async () => {
    cabecalhos["x-forwarded-for"] = "   203.0.113.7   , 10.0.0.1";
    expect(await ipDaRequisicao()).toBe("203.0.113.7");
  });

  it("aceita um único IP em x-forwarded-for", async () => {
    cabecalhos["x-forwarded-for"] = "198.51.100.4";
    expect(await ipDaRequisicao()).toBe("198.51.100.4");
  });

  it("x-forwarded-for tem prioridade sobre x-real-ip", async () => {
    cabecalhos["x-forwarded-for"] = "1.1.1.1";
    cabecalhos["x-real-ip"] = "2.2.2.2";
    expect(await ipDaRequisicao()).toBe("1.1.1.1");
  });

  it("sem x-forwarded-for, usa x-real-ip", async () => {
    cabecalhos["x-real-ip"] = "2.2.2.2";
    expect(await ipDaRequisicao()).toBe("2.2.2.2");
  });

  it("x-forwarded-for vazio cai para x-real-ip", async () => {
    cabecalhos["x-forwarded-for"] = "";
    cabecalhos["x-real-ip"] = "2.2.2.2";
    expect(await ipDaRequisicao()).toBe("2.2.2.2");
  });

  it("x-forwarded-for só com espaços cai para x-real-ip", async () => {
    cabecalhos["x-forwarded-for"] = "   ";
    cabecalhos["x-real-ip"] = "2.2.2.2";
    expect(await ipDaRequisicao()).toBe("2.2.2.2");
  });

  it('sem nenhum cabeçalho, devolve "local"', async () => {
    expect(await ipDaRequisicao()).toBe("local");
  });

  it('se não houver requisição (headers() falha), devolve "local"', async () => {
    headersFalha = true;
    expect(await ipDaRequisicao()).toBe("local");
  });

  it("corta o IP em 64 caracteres (cabeçalho forjado não infla a chave)", async () => {
    cabecalhos["x-forwarded-for"] = "z".repeat(200);
    expect(await ipDaRequisicao()).toBe("z".repeat(64));
  });

  it("mantém inteiro um valor de exatamente 64 caracteres", async () => {
    cabecalhos["x-forwarded-for"] = "w".repeat(64);
    expect(await ipDaRequisicao()).toBe("w".repeat(64));
  });

  it("aceita IPv6", async () => {
    cabecalhos["x-forwarded-for"] = "2001:db8::1, 10.0.0.1";
    expect(await ipDaRequisicao()).toBe("2001:db8::1");
  });
});

describe("limparContadoresAntigos", () => {
  it("apaga só os contadores com janela de mais de 1 dia", async () => {
    mockQuery.mockResolvedValueOnce([{}]);
    await limparContadoresAntigos();
    expect(mockQuery).toHaveBeenCalledTimes(1);
    const sql = String(mockQuery.mock.calls[0][0]);
    expect(sql).toContain("DELETE FROM rate_limit");
    expect(sql).toContain("janela_inicio < DATE_SUB(NOW(), INTERVAL 1 DAY)");
  });

  it("propaga o erro do banco (o cron decide o que fazer)", async () => {
    mockQuery.mockRejectedValueOnce(new Error("falhou"));
    await expect(limparContadoresAntigos()).rejects.toThrow("falhou");
  });
});
