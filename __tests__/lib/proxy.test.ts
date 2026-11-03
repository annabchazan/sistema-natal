import { describe, it, expect, vi, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { proxy, config } from "@/proxy";
import { SESSION_COOKIE } from "@/lib/sessaoCookie";

function req(caminho: string, opcoes: { cookie?: string } = {}) {
  const headers: Record<string, string> = {};
  if (opcoes.cookie !== undefined) headers.cookie = `${SESSION_COOKIE}=${opcoes.cookie}`;
  return new NextRequest(`http://localhost:3000${caminho}`, { headers });
}

function nonceDe(uuid: string) {
  return Buffer.from(uuid).toString("base64");
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

// ─── Barreira da área administrativa ────────────────────────────────────────

describe("proxy — área admin", () => {
  it("visitante sem cookie é mandado para o login, com o destino preservado", () => {
    const res = proxy(req("/admin"));
    expect(res.status).toBe(307);
    const destino = new URL(res.headers.get("location")!);
    expect(destino.origin).toBe("http://localhost:3000");
    expect(destino.pathname).toBe("/login");
    expect(destino.searchParams.get("next")).toBe("/admin");
  });

  it("preserva subcaminho e querystring em ?next=", () => {
    const res = proxy(req("/admin/crachas/imprimir?ids=1,2"));
    const destino = new URL(res.headers.get("location")!);
    expect(destino.pathname).toBe("/login");
    expect(destino.searchParams.get("next")).toBe("/admin/crachas/imprimir?ids=1,2");
  });

  it("cookie vazio conta como sem cookie", () => {
    const res = proxy(req("/admin", { cookie: "" }));
    expect(res.status).toBe(307);
    expect(new URL(res.headers.get("location")!).pathname).toBe("/login");
  });

  it("com cookie de sessão, deixa passar (a checagem real é no servidor)", () => {
    const res = proxy(req("/admin", { cookie: "a".repeat(64) }));
    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
  });

  it("um cookie com outro nome não libera o admin", () => {
    const r = new NextRequest("http://localhost:3000/admin", { headers: { cookie: "outro_cookie=abc" } });
    expect(proxy(r).status).toBe(307);
  });

  it("páginas públicas passam sem cookie", () => {
    for (const caminho of ["/", "/login", "/cadastro", "/checkout", "/como-funciona", "/usuario"]) {
      const res = proxy(req(caminho));
      expect(res.status, caminho).toBe(200);
      expect(res.headers.get("location"), caminho).toBeNull();
    }
  });

  it("o redirecionamento do admin não carrega o cabeçalho de CSP de página", () => {
    const res = proxy(req("/admin"));
    expect(res.headers.get("Content-Security-Policy")).toBeNull();
  });
});

// ─── CSP com nonce ──────────────────────────────────────────────────────────

describe("proxy — Content-Security-Policy", () => {
  it("a resposta traz o CSP com o nonce da requisição", () => {
    vi.spyOn(crypto, "randomUUID").mockReturnValue("11111111-2222-3333-4444-555555555555");
    const nonce = nonceDe("11111111-2222-3333-4444-555555555555");
    const csp = proxy(req("/")).headers.get("Content-Security-Policy")!;
    expect(csp).toContain(`script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`);
  });

  it("repassa o nonce e o CSP para a requisição (o Next injeta o nonce nos scripts)", () => {
    vi.spyOn(crypto, "randomUUID").mockReturnValue("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");
    const res = proxy(req("/"));
    const csp = res.headers.get("Content-Security-Policy");
    expect(res.headers.get("x-middleware-request-x-nonce")).toBe(nonceDe("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"));
    expect(res.headers.get("x-middleware-request-content-security-policy")).toBe(csp);
  });

  it("gera um nonce novo a cada requisição", () => {
    const n1 = proxy(req("/")).headers.get("x-middleware-request-x-nonce");
    const n2 = proxy(req("/")).headers.get("x-middleware-request-x-nonce");
    expect(n1).toBeTruthy();
    expect(n1).not.toBe(n2);
  });

  it("em produção, a política completa é exata e sem 'unsafe-eval'", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.spyOn(crypto, "randomUUID").mockReturnValue("uuid-fixo");
    const nonce = nonceDe("uuid-fixo");
    const csp = proxy(req("/")).headers.get("Content-Security-Policy");
    expect(csp).toBe(
      [
        "default-src 'self'",
        `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: blob: https://res.cloudinary.com",
        "font-src 'self' data:",
        "connect-src 'self'",
        "frame-src https://www.google.com",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'",
        "upgrade-insecure-requests",
      ].join("; "),
    );
    expect(csp).not.toContain("unsafe-eval");
  });

  it("em desenvolvimento, libera 'unsafe-eval' (hot reload) e não força https", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.spyOn(crypto, "randomUUID").mockReturnValue("uuid-fixo");
    const nonce = nonceDe("uuid-fixo");
    const csp = proxy(req("/")).headers.get("Content-Security-Policy")!;
    expect(csp).toContain(`script-src 'self' 'nonce-${nonce}' 'strict-dynamic' 'unsafe-eval'`);
    expect(csp).not.toContain("upgrade-insecure-requests");
    expect(csp.endsWith("frame-ancestors 'none'")).toBe(true);
  });

  it("nunca permite scripts inline sem nonce nem curingas", () => {
    vi.stubEnv("NODE_ENV", "production");
    const csp = proxy(req("/")).headers.get("Content-Security-Policy")!;
    const scriptSrc = csp.split("; ").find((d) => d.startsWith("script-src"))!;
    expect(scriptSrc).not.toContain("'unsafe-inline'");
    expect(scriptSrc).not.toContain("*");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("frame-ancestors 'none'");
  });

  it("páginas do admin com cookie também recebem o CSP", () => {
    const res = proxy(req("/admin", { cookie: "a".repeat(64) }));
    expect(res.headers.get("Content-Security-Policy")).toContain("default-src 'self'");
  });
});

// ─── Quais rotas passam pelo proxy ──────────────────────────────────────────

describe("proxy — matcher", () => {
  const [regra] = config.matcher as unknown as Array<{
    source: string;
    missing: Array<{ type: string; key: string; value?: string }>;
  }>;
  const casa = (caminho: string) => new RegExp(`^${regra.source}$`).test(caminho);

  it("cobre as páginas", () => {
    for (const caminho of ["/", "/login", "/admin", "/admin/crachas/imprimir", "/usuario", "/checkout"]) {
      expect(casa(caminho), caminho).toBe(true);
    }
  });

  it("deixa de fora API, estáticos e ícones", () => {
    for (const caminho of [
      "/api/admin/exportar",
      "/api/cron/lembretes",
      "/_next/static/chunks/app.js",
      "/_next/image",
      "/favicon.ico",
      "/icon.png",
      "/apple-icon.png",
    ]) {
      expect(casa(caminho), caminho).toBe(false);
    }
  });

  it("ignora requisições de prefetch do roteador", () => {
    expect(regra.missing).toEqual([
      { type: "header", key: "next-router-prefetch" },
      { type: "header", key: "purpose", value: "prefetch" },
    ]);
  });
});
