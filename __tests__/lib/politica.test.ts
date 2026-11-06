import { describe, it, expect, vi, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

vi.mock("@/lib/db", () => ({ default: { query: vi.fn() } }));

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get: () => ({ value: "a".repeat(64) }),
    set: vi.fn(),
    delete: vi.fn(),
  })),
}));

// redirect() do Next interrompe a renderização lançando um erro; o mock imita isso.
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

// O checkout é um componente de cliente pesado; aqui só importa se a página chega a renderizá-lo.
vi.mock("@/app/checkout/CheckoutClient", () => ({ default: () => null }));
vi.mock("@/app/aceitar-politica/AceiteForm", () => ({ default: () => null }));

import db from "@/lib/db";
import { caminhoAceitePolitica, precisaAceitarPolitica, VERSAO_POLITICA } from "@/lib/politica";
import { requireAdminAccess, requireUsuarioAutenticado } from "@/lib/auth";
import CheckoutPage from "@/app/checkout/page";
import AceitarPoliticaPage from "@/app/aceitar-politica/page";

const mockQuery = (db as unknown as { query: ReturnType<typeof vi.fn> }).query;

function sessaoDe(usuario: Record<string, unknown> | null) {
  mockQuery.mockResolvedValue([usuario ? [usuario] : []]);
}

const padrinho = (politica_versao: string | null) => ({
  id: 1,
  nome: "Maria",
  telefone: "21999999999",
  email: "maria@teste.com",
  tipo: "padrinho",
  admin_role: null,
  politica_versao,
});

const admin = (politica_versao: string | null) => ({
  ...padrinho(politica_versao),
  tipo: "admin",
  admin_role: "full",
});

async function redirecionouPara(fn: () => Promise<unknown>): Promise<string | null> {
  try {
    await fn();
    return null;
  } catch (err) {
    const msg = (err as Error).message;
    if (msg.startsWith("REDIRECT:")) return msg.slice("REDIRECT:".length);
    throw err;
  }
}

beforeEach(() => {
  mockQuery.mockReset();
});

describe("precisaAceitarPolitica", () => {
  it("quem nunca aceitou (versão nula ou ausente) precisa aceitar", () => {
    expect(precisaAceitarPolitica({ politica_versao: null })).toBe(true);
    expect(precisaAceitarPolitica({})).toBe(true);
  });

  it("quem aceitou outra versão precisa aceitar a atual", () => {
    expect(precisaAceitarPolitica({ politica_versao: "0.9" })).toBe(true);
    expect(precisaAceitarPolitica({ politica_versao: "" })).toBe(true);
  });

  it("quem aceitou a versão atual não precisa", () => {
    expect(precisaAceitarPolitica({ politica_versao: VERSAO_POLITICA })).toBe(false);
  });

  it("sem usuário, a pergunta é 'precisa' (a autenticação é checada antes)", () => {
    expect(precisaAceitarPolitica(null)).toBe(true);
  });

  it("a versão vigente é 1.0", () => {
    expect(VERSAO_POLITICA).toBe("1.0");
  });

  it("monta o caminho da tela de aceite preservando o destino", () => {
    expect(caminhoAceitePolitica("/checkout")).toBe("/aceitar-politica?next=%2Fcheckout");
    expect(caminhoAceitePolitica("/admin?tab=cartinhas")).toBe(
      "/aceitar-politica?next=%2Fadmin%3Ftab%3Dcartinhas",
    );
  });
});

describe("tela de aceite — checkout", () => {
  it("quem não aceitou é mandado para a tela de aceite e volta ao checkout depois", async () => {
    sessaoDe(padrinho(null));
    expect(await redirecionouPara(() => CheckoutPage())).toBe("/aceitar-politica?next=%2Fcheckout");
  });

  it("quem aceitou outra versão também vê a tela", async () => {
    sessaoDe(padrinho("0.9"));
    expect(await redirecionouPara(() => CheckoutPage())).toBe("/aceitar-politica?next=%2Fcheckout");
  });

  it("quem aceitou a versão atual segue direto para o checkout", async () => {
    sessaoDe(padrinho(VERSAO_POLITICA));
    expect(await redirecionouPara(() => CheckoutPage())).toBeNull();
  });

  it("sem login continua indo para o login (e não para a tela de aceite)", async () => {
    sessaoDe(null);
    expect(await redirecionouPara(() => CheckoutPage())).toBe("/login?next=/checkout");
  });
});

describe("tela de aceite — área do admin", () => {
  it("admin sem aceite é mandado para a tela de aceite", async () => {
    sessaoDe(admin(null));
    expect(await redirecionouPara(() => requireAdminAccess())).toBe("/aceitar-politica?next=%2Fadmin");
  });

  it("admin que aceitou a versão atual entra direto", async () => {
    sessaoDe(admin(VERSAO_POLITICA));
    expect(await redirecionouPara(() => requireAdminAccess())).toBeNull();
  });

  it("padrinho tentando o admin continua indo para /usuario", async () => {
    sessaoDe(padrinho(null));
    expect(await redirecionouPara(() => requireAdminAccess())).toBe("/usuario");
  });
});

describe("tela de aceite — requireUsuarioAutenticado", () => {
  it("sem aceite vai para a tela de aceite com o destino informado", async () => {
    sessaoDe(padrinho(null));
    expect(await redirecionouPara(() => requireUsuarioAutenticado("/usuario"))).toBe(
      "/aceitar-politica?next=%2Fusuario",
    );
  });

  it("com aceite devolve o usuário", async () => {
    sessaoDe(padrinho(VERSAO_POLITICA));
    const usuario = await requireUsuarioAutenticado();
    expect(usuario.id).toBe(1);
  });
});

describe("página /aceitar-politica", () => {
  const props = (next?: string) => ({ searchParams: Promise.resolve({ next }) });

  it("quem não aceitou vê a tela (não é redirecionado)", async () => {
    sessaoDe(padrinho(null));
    const resultado = await AceitarPoliticaPage(props("/checkout"));
    expect(resultado).toBeTruthy();
  });

  it("quem já aceitou a versão atual segue direto para o destino, sem ver a tela", async () => {
    sessaoDe(padrinho(VERSAO_POLITICA));
    expect(await redirecionouPara(() => AceitarPoliticaPage(props("/checkout")))).toBe("/checkout");
  });

  it("sem destino, padrinho vai para /usuario e admin para /admin", async () => {
    sessaoDe(padrinho(VERSAO_POLITICA));
    expect(await redirecionouPara(() => AceitarPoliticaPage(props()))).toBe("/usuario");
    sessaoDe(admin(VERSAO_POLITICA));
    expect(await redirecionouPara(() => AceitarPoliticaPage(props()))).toBe("/admin");
  });

  it("destino externo ou malicioso é ignorado", async () => {
    sessaoDe(padrinho(VERSAO_POLITICA));
    expect(await redirecionouPara(() => AceitarPoliticaPage(props("https://site-falso.com")))).toBe("/usuario");
    expect(await redirecionouPara(() => AceitarPoliticaPage(props("//site-falso.com")))).toBe("/usuario");
  });

  it("sem login vai para o login", async () => {
    sessaoDe(null);
    expect(await redirecionouPara(() => AceitarPoliticaPage(props("/checkout")))).toBe("/login");
  });
});

// Conferências de conteúdo de arquivo: o projeto não tem testes de componente (ambiente node).
describe("arquivos da política de privacidade", () => {
  const ler = (...partes: string[]) => readFileSync(join(process.cwd(), ...partes), "utf8");

  it("o rodapé tem o link para a política em 'Links rápidos'", () => {
    const footer = ler("app", "components", "Footer.tsx");
    expect(footer).toContain('href="/politica-de-privacidade"');
    expect(footer.indexOf("Links rápidos")).toBeLessThan(footer.indexOf("/politica-de-privacidade"));
  });

  it("o cadastro tem o checkbox, abre a política em nova aba e envia o aceite ao servidor", () => {
    const cadastro = ler("app", "cadastro", "page.tsx");
    expect(cadastro).toContain("Li e concordo com a");
    expect(cadastro).toContain('type="checkbox"');
    expect(cadastro).toContain('href="/politica-de-privacidade"');
    expect(cadastro).toContain('target="_blank"');
    expect(cadastro).toContain('rel="noopener noreferrer"');
    expect(cadastro).toMatch(/cadastrarUsuario\(\{[^}]*aceitouPolitica/);
  });

  it("a tela de aceite não mexe no localStorage (o carrinho é preservado)", () => {
    for (const arquivo of ["page.tsx", "AceiteForm.tsx"]) {
      // Ignora comentários: eles podem citar o localStorage só para explicar.
      const codigo = ler("app", "aceitar-politica", arquivo).replace(/\/\/.*$/gm, "");
      expect(codigo).not.toMatch(/localStorage|sessionStorage|clear\(\)|removeItem/);
    }
  });

  it("a página pública traz as 10 seções da política, versão 1.0 e o CNPJ", () => {
    const pagina = ler("app", "politica-de-privacidade", "page.tsx");
    expect(pagina).toContain("Versão 1.0");
    expect(pagina).toContain("12.629.489/0001-44");
    expect(pagina).toContain("vigente a partir de 06/11/2026");
    expect(pagina.match(/contato@semprecrianca\.org/g)).toHaveLength(2);
    // Só o trecho sobre autorização dos responsáveis ainda depende da organização.
    const pendentes = pagina.match(/\[[^\]]*\]/g)?.filter((t) => /confirmar com a/.test(t)) ?? [];
    expect(pendentes).toHaveLength(1);
    expect(pagina.match(/\[(data|e-mail)[^\]]*\]/g)).toBeNull();
    for (const titulo of [
      "1. Quem é responsável pelos dados",
      "2. Quais dados coletamos",
      "3. Para que usamos os dados",
      "4. Base legal",
      "5. Quem tem acesso aos dados",
      "6. Por quanto tempo guardamos os dados",
      "7. Seus direitos",
      "8. Segurança",
      "9. Cookies e armazenamento no navegador",
      "10. Alterações desta Política",
    ]) {
      expect(pagina).toContain(titulo);
    }
  });

  it("a migration v14 cria as duas colunas, nulas, sem apagar nada", () => {
    const sql = ler("migration_v14.sql");
    expect(sql).toMatch(/ALTER TABLE usuarios/);
    expect(sql).toMatch(/ADD COLUMN politica_aceita_em DATETIME NULL/);
    expect(sql).toMatch(/ADD COLUMN politica_versao VARCHAR\(20\) NULL/);
    expect(sql).not.toMatch(/DROP|DELETE|TRUNCATE|UPDATE/i);
  });
});
