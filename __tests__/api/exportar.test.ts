import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/db", () => ({ default: { query: vi.fn() } }));
vi.mock("@/lib/rateLimit", () => ({ dentroDoLimite: vi.fn() }));
vi.mock("@/lib/auth", () => ({
  getUsuarioAutenticado: vi.fn(),
  // Regra real: é admin quem tem tipo "admin" (qualquer papel: editor, full ou master).
  usuarioEhAdmin: (u: { tipo?: string } | null | undefined) => u?.tipo === "admin",
}));

import db from "@/lib/db";
import { dentroDoLimite } from "@/lib/rateLimit";
import { getUsuarioAutenticado } from "@/lib/auth";
import { GET } from "@/app/api/admin/exportar/route";

const mockQuery = (db as unknown as { query: ReturnType<typeof vi.fn> }).query;
const mockLimite = vi.mocked(dentroDoLimite);
const mockUsuario = vi.mocked(getUsuarioAutenticado);

type Papel = "editor" | "full" | "master";

const admin = (admin_role: Papel, id = 1) =>
  ({ id, nome: "Admin", telefone: "21999999999", email: "a@a.com", tipo: "admin", admin_role }) as never;

const padrinho = () =>
  ({ id: 2, nome: "Padrinho", telefone: "21999999999", email: "p@p.com", tipo: "padrinho", admin_role: null }) as never;

function linha(extras: Record<string, unknown> = {}) {
  return {
    numero_sequencial: 7,
    nome_crianca: "Ana",
    idade: 8,
    nome_instituicao: "Casa Azul",
    status: "apadrinhada",
    presente_pedido: "Boneca",
    data_limite_entrega: "2026-12-10",
    data_apadrinamento: "2026-11-02T15:30:00",
    padrinho_nome: "Maria",
    padrinho_telefone: "21999991234",
    padrinho_email: "maria@teste.com",
    ...extras,
  };
}

function chamar(query = "") {
  return GET(new NextRequest(`http://localhost/api/admin/exportar${query}`));
}

// Linhas do CSV sem o BOM. O resultado é sempre cabeçalho + uma linha por registro.
async function linhasCsv(res: Response): Promise<string[]> {
  return (await res.text()).replace(/^﻿/, "").split("\r\n");
}

beforeEach(() => {
  mockQuery.mockReset();
  mockLimite.mockReset();
  mockUsuario.mockReset();
  mockLimite.mockResolvedValue(true);
  mockQuery.mockResolvedValue([[linha()]]);
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("GET /api/admin/exportar — quem pode exportar", () => {
  it("403 sem sessão, sem tocar no banco nem no limitador", async () => {
    mockUsuario.mockResolvedValue(null);
    const res = await chamar();
    expect(res.status).toBe(403);
    expect(await res.text()).toBe("Acesso negado");
    expect(mockQuery).not.toHaveBeenCalled();
    expect(mockLimite).not.toHaveBeenCalled();
  });

  it("403 para padrinho (não é admin), sem tocar no banco nem no limitador", async () => {
    mockUsuario.mockResolvedValue(padrinho());
    const res = await chamar();
    expect(res.status).toBe(403);
    expect(mockQuery).not.toHaveBeenCalled();
    expect(mockLimite).not.toHaveBeenCalled();
  });

  // Decisão da equipe: a exportação é liberada para todo admin, inclusive o editor.
  for (const papel of ["editor", "full", "master"] as const) {
    it(`200 para admin ${papel}`, async () => {
      mockUsuario.mockResolvedValue(admin(papel));
      const res = await chamar();
      expect(res.status).toBe(200);
      expect(mockQuery).toHaveBeenCalledTimes(1);
    });
  }
});

describe("GET /api/admin/exportar — resposta", () => {
  beforeEach(() => mockUsuario.mockResolvedValue(admin("editor")));

  it("devolve CSV para download, sem cache, com BOM UTF-8", async () => {
    const res = await chamar();
    expect(res.headers.get("Content-Type")).toBe("text/csv; charset=utf-8");
    expect(res.headers.get("Cache-Control")).toBe("private, no-store");
    expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(res.headers.get("Content-Disposition")).toMatch(
      /^attachment; filename="cartinhas-natal-\d{4}-\d{2}-\d{2}\.csv"$/,
    );
    const bytes = new Uint8Array(await res.arrayBuffer());
    expect([...bytes.slice(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);
  });

  it("separa as colunas por ponto e vírgula e traz todas por padrão", async () => {
    const res = await chamar();
    const [cabecalho, dados] = await linhasCsv(res);
    expect(cabecalho).toBe(
      "Número;Nome da Criança;Idade;Instituição;Status;Presente Pedido;Prazo de Entrega;Data de Apadrinhamento;Padrinho;Telefone;E-mail",
    );
    const celulas = dados.split(";");
    expect(celulas).toHaveLength(11);
    expect(celulas.slice(0, 6)).toEqual(["7", "Ana", "8", "Casa Azul", "Apadrinhada", "Boneca"]);
    expect(celulas[8]).toBe("Maria");
    expect(celulas[9]).toBe("(21) 99999-1234");
    expect(celulas[10]).toBe("maria@teste.com");
  });

  it("sem registros devolve só o cabeçalho", async () => {
    mockQuery.mockResolvedValue([[]]);
    const linhas = await linhasCsv(await chamar());
    expect(linhas).toHaveLength(1);
  });

  it("deixa em branco os campos vazios (cartinha sem padrinho)", async () => {
    mockQuery.mockResolvedValue([
      [linha({ padrinho_nome: null, padrinho_telefone: null, padrinho_email: null, data_apadrinamento: null, data_limite_entrega: null })],
    ]);
    const [, dados] = await linhasCsv(await chamar());
    const celulas = dados.split(";");
    expect(celulas.slice(6)).toEqual(["", "", "", "", ""]);
  });

  it("status desconhecido no banco sai como veio", async () => {
    mockQuery.mockResolvedValue([[linha({ status: "inexistente" })]]);
    const [, dados] = await linhasCsv(await chamar());
    expect(dados.split(";")[4]).toBe("inexistente");
  });

  it("erro do banco devolve 500 genérico, sem vazar detalhes", async () => {
    mockQuery.mockRejectedValue(new Error("ER_ACCESS_DENIED usuario=segredo"));
    const res = await chamar();
    expect(res.status).toBe(500);
    expect(await res.text()).toBe("Erro ao gerar exportação");
  });
});

describe("GET /api/admin/exportar — limite de exportações por hora", () => {
  it("429 quando passa do limite, sem consultar o banco", async () => {
    mockUsuario.mockResolvedValue(admin("full", 5));
    mockLimite.mockResolvedValue(false);
    const res = await chamar();
    expect(res.status).toBe(429);
    expect(await res.text()).toMatch(/Muitas exportações/);
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it("o limite é por usuário: 10 exportações por hora", async () => {
    mockUsuario.mockResolvedValue(admin("editor", 42));
    await chamar();
    expect(mockLimite).toHaveBeenCalledWith("exportar:usuario:42", 10, 60 * 60);
  });

  it("dentro do limite, exporta normalmente", async () => {
    mockUsuario.mockResolvedValue(admin("master"));
    mockLimite.mockResolvedValue(true);
    expect((await chamar()).status).toBe(200);
  });
});

describe("GET /api/admin/exportar — neutralização de fórmulas no CSV", () => {
  beforeEach(() => mockUsuario.mockResolvedValue(admin("editor")));

  it.each([
    ["=", "=SOMA(1;2)"],
    ["+", "+55 21 99999-0000"],
    ["-", "-1+1"],
    ["@", "@cmd"],
  ])("valor começando com %s ganha apóstrofo na frente", async (_gatilho, perigoso) => {
    mockQuery.mockResolvedValue([[linha({ presente_pedido: perigoso })]]);
    const [, dados] = await linhasCsv(await chamar("?colunas=presente"));
    // Com ";" no valor o campo também vai entre aspas; o apóstrofo vem antes de tudo.
    expect(dados.replace(/^"|"$/g, "")).toBe(`'${perigoso}`);
    expect(dados.replace(/^"/, "").startsWith("'")).toBe(true);
  });

  it("valor sem gatilho não é alterado", async () => {
    mockQuery.mockResolvedValue([[linha({ presente_pedido: "Bola 10-20" })]]);
    const [, dados] = await linhasCsv(await chamar("?colunas=presente"));
    expect(dados).toBe("Bola 10-20");
  });

  it("neutraliza também gatilho de tab e de retorno de carro", async () => {
    mockQuery.mockResolvedValue([[linha({ nome_crianca: "\t=1+1" }), linha({ nome_crianca: "\r=1+1" })]]);
    const res = await chamar("?colunas=nome_crianca");
    const texto = (await res.text()).replace(/^﻿/, "");
    expect(texto).toContain("'\t=1+1");
    expect(texto).toContain("\"'\r=1+1\"");
    expect(texto).not.toMatch(/(^|\r\n)[=+\-@]/);
  });

  it("vale para todas as colunas de texto livre (nome, instituição, padrinho, e-mail)", async () => {
    mockQuery.mockResolvedValue([
      [linha({ nome_crianca: "=A1", nome_instituicao: "+B1", padrinho_nome: "-C1", padrinho_email: "@d.com" })],
    ]);
    const [, dados] = await linhasCsv(await chamar());
    const celulas = dados.split(";");
    expect(celulas[1]).toBe("'=A1");
    expect(celulas[3]).toBe("'+B1");
    expect(celulas[8]).toBe("'-C1");
    expect(celulas[10]).toBe("'@d.com");
  });

  it("campos com ponto e vírgula, vírgula, aspas ou quebra de linha vão entre aspas", async () => {
    mockQuery.mockResolvedValue([
      [linha({ presente_pedido: 'Bola; "azul", grande\nnova' })],
    ]);
    const res = await chamar("?colunas=presente");
    const texto = (await res.text()).replace(/^﻿/, "");
    expect(texto.split("\r\n")[1]).toBe('"Bola; ""azul"", grande\nnova"');
  });
});

describe("GET /api/admin/exportar — filtros", () => {
  beforeEach(() => mockUsuario.mockResolvedValue(admin("editor")));

  const sqlEParams = () => {
    const [sql, params] = mockQuery.mock.calls[0];
    return { sql: String(sql).replace(/\s+/g, " "), params: params as unknown[] };
  };

  it("sem filtros, não usa WHERE e ordena por número e id", async () => {
    await chamar();
    const { sql, params } = sqlEParams();
    expect(sql).not.toContain("WHERE");
    expect(sql).toContain("ORDER BY c.numero_sequencial ASC, c.id ASC");
    expect(params).toEqual([]);
  });

  it("filtra por status, com parâmetros e não por texto na SQL", async () => {
    await chamar("?status=entregue,apadrinhada");
    const { sql, params } = sqlEParams();
    expect(sql).toContain("WHERE c.status IN (?,?)");
    expect(params).toEqual(["entregue", "apadrinhada"]);
  });

  it("ignora status inválido (inclusive tentativa de injeção)", async () => {
    await chamar("?status=entregue,%27%20OR%201%3D1%20--,qualquer");
    const { sql, params } = sqlEParams();
    expect(sql).toContain("WHERE c.status IN (?)");
    expect(params).toEqual(["entregue"]);
    expect(sql).not.toContain("OR 1=1");
  });

  it("só status inválidos equivalem a não filtrar", async () => {
    await chamar("?status=foo,bar");
    expect(sqlEParams().sql).not.toContain("WHERE");
  });

  it("todos os 7 status marcados equivalem a não filtrar", async () => {
    await chamar("?status=disponivel,apadrinhada,conferida,carente,embrulhado,entregue,cancelada");
    expect(sqlEParams().sql).not.toContain("WHERE");
  });

  it("filtra por instituição, aceitando só números", async () => {
    await chamar("?instituicoes=1,2,abc,3x,-4");
    const { sql, params } = sqlEParams();
    expect(sql).toContain("WHERE c.instituicao_id IN (?,?)");
    expect(params).toEqual([1, 2]);
  });

  it("combina status e instituição com AND, nessa ordem de parâmetros", async () => {
    await chamar("?status=conferida&instituicoes=5,6");
    const { sql, params } = sqlEParams();
    expect(sql).toContain("WHERE c.status IN (?) AND c.instituicao_id IN (?,?)");
    expect(params).toEqual(["conferida", 5, 6]);
  });

  it("exporta só as colunas escolhidas, na ordem pedida", async () => {
    const res = await chamar("?colunas=nome_crianca,numero,idade");
    const [cabecalho, dados] = await linhasCsv(res);
    expect(cabecalho).toBe("Nome da Criança;Número;Idade");
    expect(dados).toBe("Ana;7;8");
  });

  it("ignora colunas inexistentes", async () => {
    const [cabecalho] = await linhasCsv(await chamar("?colunas=idade,senha,xyz"));
    expect(cabecalho).toBe("Idade");
  });

  it("sem nenhuma coluna válida, volta para todas as 11", async () => {
    const [cabecalho] = await linhasCsv(await chamar("?colunas=foo,bar"));
    expect(cabecalho.split(";")).toHaveLength(11);
  });

  it("os filtros e as colunas funcionam juntos", async () => {
    const res = await chamar("?status=apadrinhada&instituicoes=1&colunas=nome_crianca,status");
    const [cabecalho, dados] = await linhasCsv(res);
    expect(cabecalho).toBe("Nome da Criança;Status");
    expect(dados).toBe("Ana;Apadrinhada");
    expect(sqlEParams().params).toEqual(["apadrinhada", 1]);
  });
});
