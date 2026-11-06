// Gate estático de segurança: varre o código-fonte e falha se um padrão inseguro voltar.
// Roda no `npm run security` e no hook de pré-commit. Ver docs/seguranca.md.
import { describe, it, expect } from "vitest";
import { existsSync, readdirSync, readFileSync, statSync } from "fs";
import { join, relative } from "path";
import { execSync } from "child_process";

const RAIZ = process.cwd();
const IGNORAR = new Set(["node_modules", ".next", ".git", ".vercel", "coverage"]);

function listar(dir: string, extensoes: string[], saida: string[] = []): string[] {
  for (const nome of readdirSync(dir)) {
    if (IGNORAR.has(nome)) continue;
    const caminho = join(dir, nome);
    if (statSync(caminho).isDirectory()) listar(caminho, extensoes, saida);
    else if (extensoes.some((e) => nome.endsWith(e))) saida.push(caminho);
  }
  return saida;
}

const rel = (f: string) => relative(RAIZ, f).replace(/\\/g, "/");
const ler = (f: string) => readFileSync(f, "utf8");

const CODIGO_APP = [
  ...listar(join(RAIZ, "app"), [".ts", ".tsx"]),
  ...listar(join(RAIZ, "lib"), [".ts", ".tsx"]),
  ...listar(join(RAIZ, "emails"), [".ts", ".tsx"]),
];

// ─── Autenticação em Server Actions e rotas ──────────────────────────────────

// Actions que PRECISAM ser públicas (visitante sem login), com o motivo.
const ACOES_PUBLICAS: Record<string, string> = {
  "app/actions/auth.ts": "cadastrarUsuario loginUsuario logoutUsuario buscarUsuarioAutenticado solicitarRecuperacaoSenha redefinirSenha",
  "app/actions/cartinhas.ts": "gerarNumeroSequencial buscarCartinhasParaCheckout listarCartinhas contarCartinhasApadrinhadas listarCartinhasFiltradas",
  "app/actions/campanhas.ts": "obterOuCriarCampanhaAtiva listarCampanhas",
  "app/actions/instituicoes.ts": "listarInstituicoesComCartinhas",
  "app/actions/pontosEntrega.ts": "listarPontosEntrega",
  "app/actions/tags.ts": "listarTags",
};

const GUARDAS = ["validarPermissaoAdmin(", "getUsuarioAutenticado(", "requireAdminAccess(", "requireUsuarioAutenticado("];

function funcoesExportadas(codigo: string) {
  const partes = codigo.split(/^export async function /m).slice(1);
  return partes.map((p) => ({ nome: p.slice(0, p.indexOf("(")).trim(), corpo: p }));
}

describe("guarda de autenticação", () => {
  const arquivosActions = listar(join(RAIZ, "app", "actions"), [".ts"]);

  it("há Server Actions para verificar", () => {
    expect(arquivosActions.length).toBeGreaterThan(0);
  });

  for (const arquivo of arquivosActions) {
    it(`toda Server Action de ${rel(arquivo)} chama uma guarda (ou está na lista de públicas)`, () => {
      const publicas = (ACOES_PUBLICAS[rel(arquivo)] ?? "").split(" ");
      const semGuarda = funcoesExportadas(ler(arquivo))
        .filter((f) => !publicas.includes(f.nome))
        .filter((f) => !GUARDAS.some((g) => f.corpo.includes(g)))
        .map((f) => f.nome);
      expect(semGuarda, `Actions sem guarda de sessão/papel: ${semGuarda.join(", ")}`).toEqual([]);
    });
  }

  it("toda rota de API tem autenticação de usuário ou de cron", () => {
    const rotas = listar(join(RAIZ, "app", "api"), ["route.ts"]);
    expect(rotas.length).toBeGreaterThan(0);
    const semGuarda = rotas.filter((r) => {
      const c = ler(r);
      return !c.includes("getUsuarioAutenticado(") && !c.includes("cronAutorizado(");
    });
    expect(semGuarda.map(rel)).toEqual([]);
  });

  it("rotas de cron usam comparação em tempo constante (lib/cron)", () => {
    for (const r of listar(join(RAIZ, "app", "api", "cron"), ["route.ts"])) {
      expect(ler(r), rel(r)).toContain("cronAutorizado(");
      expect(ler(r), rel(r)).not.toMatch(/===\s*`Bearer/);
    }
  });

  it("páginas do admin passam pelo layout protegido por requireAdminAccess", () => {
    expect(ler(join(RAIZ, "app", "admin", "layout.tsx"))).toContain("requireAdminAccess()");
  });
});

// ─── Padrões proibidos ───────────────────────────────────────────────────────

describe("padrões proibidos no código", () => {
  const PROIBIDOS: [string, RegExp][] = [
    ["dangerouslySetInnerHTML", /dangerouslySetInnerHTML/],
    ["innerHTML", /\.innerHTML\s*=/],
    ["eval()", /\beval\s*\(/],
    ["new Function()", /new Function\s*\(/],
    ["execução de shell", /child_process|\bexecSync\s*\(|\bspawn\s*\(/],
    ["$queryRawUnsafe", /queryRawUnsafe/],
    ["Math.random para segurança", /Math\.random\(\)\.toString\(36\)/],
  ];

  for (const [nome, regex] of PROIBIDOS) {
    it(`sem ${nome}`, () => {
      const achados = CODIGO_APP.filter((f) => regex.test(ler(f))).map(rel);
      expect(achados).toEqual([]);
    });
  }

  it("SQL só interpola fragmentos montados no servidor (placeholders/condições), nunca entrada crua", () => {
    const PERMITIDOS = new Set([
      "placeholders", "placeholdersAtualizar", "placeholdersStatus", "ph", "where", "COLUNAS_CARTINHA_PUBLICA",
      "condicoes.join(\" AND \")",
    ]);
    const problemas: string[] = [];
    for (const arquivo of CODIGO_APP) {
      const codigo = ler(arquivo);
      const chamadas = codigo.split(/\.query(?:<[^>]*>)?\(/).slice(1);
      for (const chamada of chamadas) {
        const sql = chamada.slice(0, chamada.search(/\);|\)\s*\n/) === -1 ? 800 : chamada.search(/\);|\)\s*\n/));
        for (const m of sql.matchAll(/\$\{([^}]+)\}/g)) {
          if (!PERMITIDOS.has(m[1].trim())) problemas.push(`${rel(arquivo)}: \${${m[1]}}`);
        }
      }
    }
    expect(problemas).toEqual([]);
  });

  it("nenhuma variável NEXT_PUBLIC_ guarda segredo", () => {
    const usadas = new Set<string>();
    for (const f of CODIGO_APP) for (const m of ler(f).matchAll(/NEXT_PUBLIC_[A-Z0-9_]+/g)) usadas.add(m[0]);
    for (const nome of usadas) expect(nome, "variável exposta ao navegador").not.toMatch(/SECRET|KEY|TOKEN|PASSWORD|SENHA/);
  });
});

// ─── Segredos no repositório ─────────────────────────────────────────────────

describe("segredos e arquivos que não podem ser versionados", () => {
  const PADROES_SEGREDO: [string, RegExp][] = [
    ["chave Resend", /\bre_[A-Za-z0-9]{20,}/],
    ["chave secreta estilo sk_", /\bsk_(live|test)_[A-Za-z0-9]{16,}/],
    ["chave AWS", /\bAKIA[0-9A-Z]{16}\b/],
    ["chave privada", /-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----/],
    ["token de bot", /\b\d{8,10}:[A-Za-z0-9_-]{35}\b/],
    ["connection string com senha", /\b(mysql|postgres(ql)?|mongodb(\+srv)?):\/\/[^\s:@/]+:[^\s@/]+@/],
    ["JWT", /\beyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\./],
    ["API secret do Cloudinary em código", /CLOUDINARY_API_SECRET\s*=\s*['"][^'"]+['"]/],
  ];

  const ARQUIVOS_TEXTO = [
    ...CODIGO_APP,
    ...listar(join(RAIZ, "__tests__"), [".ts"]).filter((f) => !rel(f).endsWith("seguranca/gate.test.ts")),
    ...readdirSync(RAIZ)
      .filter((n) => /\.(md|sql|json|mjs|ts|txt)$/.test(n) && n !== "package-lock.json")
      .map((n) => join(RAIZ, n)),
  ];

  for (const [nome, regex] of PADROES_SEGREDO) {
    it(`sem ${nome} no código`, () => {
      const achados = ARQUIVOS_TEXTO.filter((f) => regex.test(ler(f))).map(rel);
      expect(achados).toEqual([]);
    });
  }

  it(".gitignore cobre .env*", () => {
    expect(ler(join(RAIZ, ".gitignore"))).toMatch(/^\.env\*/m);
  });

  it("nenhum .env, dump ou lixo de shell versionado", () => {
    let versionados: string[] = [];
    try {
      versionados = execSync("git ls-files", { cwd: RAIZ, encoding: "utf8" }).split("\n").filter(Boolean);
    } catch {
      return; // fora de um repositório git (ex.: CI de tarball): nada a checar
    }
    const ruins = versionados.filter((f) => existsSync(join(RAIZ, f))).filter((f) => /(^|\/)\.env(\.|$)/.test(f) || /\.stackdump$/.test(f) || /\.(pem|key)$/.test(f));
    expect(ruins).toEqual([]);
  });
});

// ─── Sessão, senha, cookies, headers ─────────────────────────────────────────

describe("sessão e senha", () => {
  const auth = ler(join(RAIZ, "lib", "auth.ts"));

  it("cookie de sessão é httpOnly, sameSite e secure em produção", () => {
    expect(auth).toMatch(/httpOnly:\s*true/);
    expect(auth).toMatch(/sameSite:\s*"(lax|strict)"/);
    expect(auth).toMatch(/secure:\s*process\.env\.NODE_ENV === "production"/);
  });

  it("cookie usa o prefixo __Host- em produção", () => {
    expect(ler(join(RAIZ, "lib", "sessaoCookie.ts"))).toContain("__Host-");
  });

  it("sessão é validada no banco e só o hash do token é guardado", () => {
    expect(auth).toContain("FROM sessoes");
    expect(auth).toContain("sha256Hex(token)");
  });

  it("senha com scrypt e comparação em tempo constante, sem fallback em texto puro", () => {
    expect(auth).toContain("scryptSync");
    expect(auth).toContain("timingSafeEqual");
    expect(auth).not.toMatch(/senha\s*===\s*hashArmazenado/);
  });

  it("reset_token é guardado como hash", () => {
    const acoes = ler(join(RAIZ, "app", "actions", "auth.ts"));
    expect(acoes).toContain("sha256Hex(token)");
    expect(acoes).not.toMatch(/\[token,\s*expiry/);
  });

  it("redefinir senha derruba as sessões", () => {
    expect(ler(join(RAIZ, "app", "actions", "auth.ts"))).toContain("revogarSessoesDoUsuario(");
  });
});

describe("headers, CSP e proxy", () => {
  const config = ler(join(RAIZ, "next.config.ts"));
  const proxy = ler(join(RAIZ, "proxy.ts"));

  it("next.config define os headers de segurança", () => {
    for (const h of ["Strict-Transport-Security", "X-Content-Type-Options", "X-Frame-Options", "Referrer-Policy", "Permissions-Policy"]) {
      expect(config, h).toContain(h);
    }
    expect(config).toContain("poweredByHeader: false");
  });

  it("CSP com nonce, sem unsafe-inline em script, object-src none e frame-ancestors none", () => {
    expect(proxy).toContain("'nonce-${nonce}'");
    expect(proxy).toContain("object-src 'none'");
    expect(proxy).toContain("frame-ancestors 'none'");
    expect(proxy).toContain("base-uri 'self'");
    const linhaScript = proxy.split("\n").find((l) => l.includes("script-src")) ?? "";
    expect(linhaScript).not.toContain("'unsafe-inline'");
  });

  it("o proxy não roda em /api (não sobrescreve headers de resposta de API)", () => {
    expect(proxy).toMatch(/\(\?!api\|/);
  });

  it("proxy.ts substituiu middleware.ts (os dois juntos quebram o Next 16)", () => {
    expect(existsSync(join(RAIZ, "proxy.ts"))).toBe(true);
    expect(existsSync(join(RAIZ, "middleware.ts"))).toBe(false);
  });

  it("não existe rota de diagnóstico que devolva pedaço de chave em produção", () => {
    expect(existsSync(join(RAIZ, "app", "api", "admin", "test-email"))).toBe(false);
  });
});

describe("redirecionamento pós-login", () => {
  it("o ?next= passa por caminhoInternoSeguro (sem open redirect)", () => {
    const login = ler(join(RAIZ, "app", "login", "page.tsx"));
    expect(login).toContain("caminhoInternoSeguro(searchParams.get(\"next\"))");
    expect(login).not.toMatch(/router\.push\(\s*searchParams/);
  });
});

describe("uploads", () => {
  const cartinhas = ler(join(RAIZ, "app", "actions", "cartinhas.ts"));

  it("tipo da imagem vem da assinatura, não do File.type do cliente", () => {
    expect(cartinhas).toContain("tipoImagemDoArquivo(");
    expect(cartinhas).not.toMatch(/foto_cartinha\.type/);
  });

  it("tamanho máximo checado antes do envio", () => {
    expect(cartinhas).toMatch(/foto_cartinha\.size\s*>\s*5 \* 1024 \* 1024/);
  });
});

describe("banco", () => {
  it("SSL é aplicado quando DB_SSL=true e o certificado é verificado", () => {
    const db = ler(join(RAIZ, "lib", "db.ts"));
    expect(db).toContain("DB_SSL");
    expect(db).toContain("rejectUnauthorized: true");
  });
});
