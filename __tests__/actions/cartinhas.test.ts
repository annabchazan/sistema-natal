import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

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

vi.mock("@/lib/rateLimit", () => ({
  // Funções simples (não vi.fn) pra sobreviverem ao vi.resetAllMocks() do beforeEach.
  dentroDoLimite: async () => true,
  ipDaRequisicao: async () => "127.0.0.1",
  limparContadoresAntigos: async () => undefined,
}));

vi.mock("@/lib/email", () => ({
  enviarConfirmacaoApadrinhamento: vi.fn().mockResolvedValue({ ok: true }),
  enviarNotificacaoEntrega: vi.fn().mockResolvedValue({ ok: true }),
  enviarCancelamentoApadrinamento: vi.fn().mockResolvedValue({ ok: true }),
  enviarAvisoDesistenciaEquipe: vi.fn().mockResolvedValue({ ok: true }),
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

vi.mock("@/lib/cloudinary", () => ({
  apagarImagem: vi.fn(),
  apagarImagens: vi.fn(),
}));

import db from "@/lib/db";
import { getUsuarioAutenticado, validarPermissaoAdmin } from "@/lib/auth";
import { enviarConfirmacaoApadrinhamento, enviarCancelamentoApadrinamento, enviarAvisoDesistenciaEquipe } from "@/lib/email";
import { apagarImagem } from "@/lib/cloudinary";
import { salvarCartinha, excluirCartinha, finalizarApadrinamento, cancelarApadrinamento, gerarNumeroSequencial, listarCartinhasFiltradas } from "@/app/actions/cartinhas";

const mockDb = db as unknown as {
  query: ReturnType<typeof vi.fn>;
  getConnection: ReturnType<typeof vi.fn>;
};
const mockGetUsuario = vi.mocked(getUsuarioAutenticado);
const mockPermissao = vi.mocked(validarPermissaoAdmin);
const mockEnviarConfirmacao = vi.mocked(enviarConfirmacaoApadrinhamento);
const mockEnviarCancelamento = vi.mocked(enviarCancelamentoApadrinamento);
const mockEnviarAvisoEquipe = vi.mocked(enviarAvisoDesistenciaEquipe);
const mockApagarImagem = vi.mocked(apagarImagem);

const usuarioFake = {
  id: 1,
  nome: "Padrinho Teste",
  telefone: "21999999999",
  email: "padrinho@teste.com",
  tipo: "padrinho" as const,
  admin_role: null,
  politica_versao: "1.0",
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

// ─── gerarNumeroSequencial ─────────────────────────────────────────────────

describe("gerarNumeroSequencial", () => {
  it("usa base + 0 quando a instituição ainda não tem nenhuma cartinha", async () => {
    mockDb.query
      .mockResolvedValueOnce([[{ base: 20 }]])   // soma de vagas das instituições anteriores
      .mockResolvedValueOnce([[{ maximo: null }]]); // nenhuma cartinha ainda
    const numero = await gerarNumeroSequencial(2);
    expect(numero).toBe(20);
  });

  it("usa o maior número já emitido + 1, não a contagem de linhas atuais", async () => {
    // Regressão do bug: instituição com cartinhas numeradas até 5, mas só 4
    // linhas restantes (uma foi excluída no meio). Se a próxima cartinha
    // fosse numerada pela contagem (4), reapareceria o número 5, que já
    // está em uso por outra cartinha existente.
    mockDb.query
      .mockResolvedValueOnce([[{ base: 0 }]])
      .mockResolvedValueOnce([[{ maximo: 5 }]]);
    const numero = await gerarNumeroSequencial(1);
    expect(numero).toBe(6);
  });

  it("propaga erro do banco em vez de devolver 0 silenciosamente", async () => {
    mockDb.query.mockRejectedValueOnce(new Error("conexão perdida"));
    await expect(gerarNumeroSequencial(1)).rejects.toThrow("conexão perdida");
  });
});

// ─── finalizarApadrinamento ───────────────────────────────────────────────────

describe("finalizarApadrinamento", () => {
  it("rejeita quem ainda não aceitou a Política de Privacidade, sem tocar no banco", async () => {
    mockGetUsuario.mockResolvedValue({ ...usuarioFake, politica_versao: null });
    const res = await finalizarApadrinamento([1]);
    expect(res.success).toBe(false);
    expect(res.message).toMatch(/Política de Privacidade/);
    expect(mockDb.getConnection).not.toHaveBeenCalled();
  });

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
    // SELECT ... FOR UPDATE retorna vazio — cartinha não encontrada com os critérios
    const conn = mockConexao([[[]]]);
    const res = await cancelarApadrinamento(99);
    expect(res.success).toBe(false);
    expect(res.message).toMatch(/não foi possível cancelar/i);
    expect(conn.rollback).toHaveBeenCalled();
  });

  it("cancela e volta status para disponivel quando tudo ok", async () => {
    mockGetUsuario.mockResolvedValue(usuarioFake);
    mockEnviarCancelamento.mockResolvedValue({ ok: true });
    mockEnviarAvisoEquipe.mockResolvedValue({ ok: true });
    const conn = mockConexao([
      [[{ id: 1, nome_crianca: "Ana", presente_pedido: "Boneca", numero_sequencial: 1 }]], // SELECT ... FOR UPDATE
      [{ affectedRows: 1 }], // UPDATE cartinhas
      [{ insertId: 1 }],     // INSERT INTO desistencias
    ]);
    const res = await cancelarApadrinamento(1);
    expect(res.success).toBe(true);
    expect(res.message).toMatch(/cancelado/i);
    expect(conn.commit).toHaveBeenCalled();
  });
});

// ─── listarCartinhasFiltradas ──────────────────────────────────────────────

describe("listarCartinhasFiltradas", () => {
  function mockListagem() {
    mockDb.query
      .mockResolvedValueOnce([[{ total: 0 }]])
      .mockResolvedValueOnce([[]]);
  }

  it("filtra por instituição", async () => {
    mockListagem();
    await listarCartinhasFiltradas({ instituicao_id: 3 });
    const [sql, params] = mockDb.query.mock.calls[0];
    expect(sql).toContain("c.instituicao_id = ?");
    expect(params).toEqual([3]);
  });

  it("ignora instituição inválida", async () => {
    mockListagem();
    await listarCartinhasFiltradas({ instituicao_id: -1 });
    const [sql, params] = mockDb.query.mock.calls[0];
    expect(sql).not.toContain("instituicao_id");
    expect(params).toEqual([]);
  });

  it("busca por nome ou presente com LIKE parametrizado e escapa curingas", async () => {
    mockListagem();
    await listarCartinhasFiltradas({ nome_crianca: "  Ana_%  " });
    const [sql, params] = mockDb.query.mock.calls[0];
    expect(sql).toContain("(c.nome_crianca LIKE ? OR c.presente_pedido LIKE ?)");
    expect(params).toEqual(["%Ana\\_\\%%", "%Ana\\_\\%%"]);
  });

  it("ignora busca vazia e corta nome longo", async () => {
    mockListagem();
    await listarCartinhasFiltradas({ nome_crianca: "   " });
    expect(mockDb.query.mock.calls[0][0]).not.toContain("LIKE");

    mockListagem();
    await listarCartinhasFiltradas({ nome_crianca: "a".repeat(500) });
    const params = mockDb.query.mock.calls[2][1] as string[];
    expect(params[0]).toHaveLength(102);
  });

  it("combina instituição, nome e categoria", async () => {
    mockListagem();
    await listarCartinhasFiltradas({ tag_id: 2, instituicao_id: 5, nome_crianca: "Lu" });
    expect(mockDb.query.mock.calls[0][1]).toEqual([2, 5, "%Lu%", "%Lu%"]);
  });
});

// ─── salvarCartinha: libera o padrinho ao voltar para a lista ───────────────

describe("salvarCartinha (cartinha volta para disponivel/carente)", () => {
  function formEdicao(status: string) {
    const f = new FormData();
    f.set("id", "7");
    f.set("nome_crianca", "Ana");
    f.set("idade", "8");
    f.set("texto_cartinha", "Querido Papai Noel");
    f.set("presente_pedido", "Boneca");
    f.set("instituicao_id", "1");
    f.set("numero_sequencial", "12");
    f.set("status", status);
    return f;
  }

  function prepararAdmin(anterior: Record<string, unknown>, extrasConn: unknown[] = [[{}], [{}], [{}]]) {
    mockPermissao.mockResolvedValue({
      ok: true,
      usuario: { ...usuarioFake, tipo: "admin", admin_role: "full" },
    } as never);
    mockDb.query
      .mockResolvedValueOnce([[{ id: 1 }]])          // instituição existe
      .mockResolvedValueOnce([[]])                   // número não duplicado
      .mockResolvedValueOnce([[{
        status: "apadrinhada", nome_crianca: "Ana", presente_pedido: "Boneca",
        numero_sequencial: 12, foto_cartinha: null, apadrinhado_por_usuario_id: 5,
        nome_padrinho: null, email_padrinho: null,
        padrinho_nome: "Maria", padrinho_email: "maria@teste.com",
        ...anterior,
      }]])
      .mockResolvedValue([{}]);
    return mockConexao(extrasConn);
  }

  it("limpa o vínculo e registra a desistência quando volta para carente", async () => {
    const conn = prepararAdmin({});
    const res = await salvarCartinha(null, formEdicao("carente"));
    expect(res.success).toBe(true);
    const sqls = conn.query.mock.calls.map((c) => String(c[0]));
    expect(sqls.some((q) => /apadrinhado_por_usuario_id = NULL[\s\S]*data_apadrinamento = NULL[\s\S]*nome_padrinho = NULL[\s\S]*email_padrinho = NULL/.test(q))).toBe(true);
    const insert = conn.query.mock.calls.find((c) => /INSERT INTO desistencias/.test(String(c[0])));
    expect(insert?.[1]).toEqual([7, 5, "Maria", "maria@teste.com", "Ana", 12]);
    expect(conn.commit).toHaveBeenCalled();
    expect(conn.release).toHaveBeenCalled();
  });

  it("desfaz tudo se algum passo falhar", async () => {
    const conn = prepararAdmin({});
    conn.query.mockRejectedValueOnce(new Error("falha"));
    const res = await salvarCartinha(null, formEdicao("disponivel"));
    expect(res.success).toBe(false);
    expect(conn.rollback).toHaveBeenCalled();
    expect(conn.commit).not.toHaveBeenCalled();
    expect(conn.release).toHaveBeenCalled();
  });

  it("limpa vínculo velho sem registrar desistência se já estava livre", async () => {
    const conn = prepararAdmin({ status: "disponivel" });
    const res = await salvarCartinha(null, formEdicao("disponivel"));
    expect(res.success).toBe(true);
    expect(conn.query.mock.calls.some((c) => /INSERT INTO desistencias/.test(String(c[0])))).toBe(false);
    expect(conn.commit).toHaveBeenCalled();
  });

  it("mantém o padrinho quando o novo status não é livre", async () => {
    prepararAdmin({});
    const res = await salvarCartinha(null, formEdicao("conferida"));
    expect(res.success).toBe(true);
    expect(mockDb.getConnection).not.toHaveBeenCalled();
  });
});

// ─── Cloudinary: apagar imagens ─────────────────────────────────────────────

const FOTO_VELHA = "https://res.cloudinary.com/demo/image/upload/v1/velha.jpg";
const FOTO_NOVA = "https://res.cloudinary.com/demo/image/upload/v2/nova.jpg";

describe("excluirCartinha (imagem no Cloudinary)", () => {
  beforeEach(() => {
    mockPermissao.mockResolvedValue({
      ok: true,
      usuario: { ...usuarioFake, tipo: "admin", admin_role: "full" },
    } as never);
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("apaga a imagem depois de excluir a cartinha", async () => {
    mockDb.query
      .mockResolvedValueOnce([[{ foto_cartinha: FOTO_VELHA }]])
      .mockResolvedValueOnce([{}]);
    const res = await excluirCartinha(7);
    expect(res.success).toBe(true);
    expect(mockApagarImagem).toHaveBeenCalledWith(FOTO_VELHA);
    expect(mockApagarImagem.mock.invocationCallOrder[0]).toBeGreaterThan(
      mockDb.query.mock.invocationCallOrder[1],
    );
  });

  it("não apaga a imagem se o DELETE da cartinha falhar", async () => {
    mockDb.query
      .mockResolvedValueOnce([[{ foto_cartinha: FOTO_VELHA }]])
      .mockRejectedValueOnce(new Error("fk"));
    const res = await excluirCartinha(7);
    expect(res.success).toBe(false);
    expect(mockApagarImagem).not.toHaveBeenCalled();
  });

  it("falha ao apagar no Cloudinary não impede a exclusão", async () => {
    mockDb.query
      .mockResolvedValueOnce([[{ foto_cartinha: FOTO_VELHA }]])
      .mockResolvedValueOnce([{}]);
    mockApagarImagem.mockResolvedValue(false);
    const res = await excluirCartinha(7);
    expect(res.success).toBe(true);
  });

  it("cartinha sem foto não gera chamada com URL (apagarImagem recebe vazio)", async () => {
    mockDb.query.mockResolvedValueOnce([[{ foto_cartinha: null }]]).mockResolvedValueOnce([{}]);
    const res = await excluirCartinha(7);
    expect(res.success).toBe(true);
    expect(mockApagarImagem).toHaveBeenCalledWith(null);
  });

  it("sem permissão, não lê nem apaga nada", async () => {
    mockPermissao.mockResolvedValue({ ok: false, message: "negado" } as never);
    const res = await excluirCartinha(7);
    expect(res.success).toBe(false);
    expect(mockDb.query).not.toHaveBeenCalled();
    expect(mockApagarImagem).not.toHaveBeenCalled();
  });
});

describe("salvarCartinha (imagem no Cloudinary)", () => {
  function form(extras: Record<string, string | File> = {}) {
    const f = new FormData();
    f.set("id", "7");
    f.set("nome_crianca", "Ana");
    f.set("idade", "8");
    f.set("texto_cartinha", "Querido Papai Noel");
    f.set("presente_pedido", "Boneca");
    f.set("instituicao_id", "1");
    f.set("numero_sequencial", "12");
    f.set("status", "conferida");
    for (const [k, v] of Object.entries(extras)) f.set(k, v);
    return f;
  }

  function jpeg() {
    return new File([new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])], "foto.jpg", {
      type: "image/jpeg",
    });
  }

  function prepararEdicao(fotoAnterior: string | null, updateFalha = false) {
    mockPermissao.mockResolvedValue({
      ok: true,
      usuario: { ...usuarioFake, tipo: "admin", admin_role: "full" },
    } as never);
    mockDb.query
      .mockResolvedValueOnce([[{ id: 1 }]])
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([[{
        status: "apadrinhada", nome_crianca: "Ana", presente_pedido: "Boneca",
        numero_sequencial: 12, foto_cartinha: fotoAnterior, apadrinhado_por_usuario_id: 5,
        nome_padrinho: null, email_padrinho: null,
        padrinho_nome: "Maria", padrinho_email: "maria@teste.com",
      }]]);
    if (updateFalha) mockDb.query.mockRejectedValueOnce(new Error("update falhou"));
    else mockDb.query.mockResolvedValue([{}]);
  }

  function stubUpload() {
    vi.stubEnv("CLOUDINARY_CLOUD_NAME", "demo");
    vi.stubEnv("CLOUDINARY_API_KEY", "k");
    vi.stubEnv("CLOUDINARY_API_SECRET", "s");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ secure_url: FOTO_NOVA }) }),
    );
  }

  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
              });

  it("foto trocada: apaga a antiga depois do UPDATE", async () => {
    stubUpload();
    prepararEdicao(FOTO_VELHA);
    const res = await salvarCartinha(null, form({ foto_cartinha: jpeg() }));
    expect(res.success).toBe(true);
    expect(mockApagarImagem).toHaveBeenCalledTimes(1);
    expect(mockApagarImagem).toHaveBeenCalledWith(FOTO_VELHA);
  });

  it("foto removida (checkbox): apaga a antiga", async () => {
    prepararEdicao(FOTO_VELHA);
    const res = await salvarCartinha(null, form({ remover_foto: "on" }));
    expect(res.success).toBe(true);
    expect(mockApagarImagem).toHaveBeenCalledWith(FOTO_VELHA);
  });

  it("edição sem mexer na foto: não apaga nada", async () => {
    prepararEdicao(FOTO_VELHA);
    const res = await salvarCartinha(null, form());
    expect(res.success).toBe(true);
    expect(mockApagarImagem).not.toHaveBeenCalled();
  });

  it("cartinha sem foto anterior recebendo foto nova: não apaga nada", async () => {
    stubUpload();
    prepararEdicao(null);
    const res = await salvarCartinha(null, form({ foto_cartinha: jpeg() }));
    expect(res.success).toBe(true);
    expect(mockApagarImagem).not.toHaveBeenCalled();
  });

  it("UPDATE falhou: mantém a antiga e apaga a foto nova que ficaria órfã", async () => {
    stubUpload();
    prepararEdicao(FOTO_VELHA, true);
    const res = await salvarCartinha(null, form({ foto_cartinha: jpeg() }));
    expect(res.success).toBe(false);
    expect(mockApagarImagem).toHaveBeenCalledTimes(1);
    expect(mockApagarImagem).toHaveBeenCalledWith(FOTO_NOVA);
    expect(mockApagarImagem).not.toHaveBeenCalledWith(FOTO_VELHA);
  });

  it("falha ao apagar a antiga no Cloudinary não faz a edição falhar", async () => {
    stubUpload();
    prepararEdicao(FOTO_VELHA);
    mockApagarImagem.mockResolvedValue(false);
    const res = await salvarCartinha(null, form({ foto_cartinha: jpeg() }));
    expect(res.success).toBe(true);
  });
});
