import { describe, it, expect } from "vitest";
import { caminhoInternoSeguro } from "@/app/utils/redirecionamento";

describe("caminhoInternoSeguro (?next= do login)", () => {
  it("aceita caminhos internos, com query", () => {
    expect(caminhoInternoSeguro("/admin")).toBe("/admin");
    expect(caminhoInternoSeguro("/admin?aba=cartinhas&pagina=2")).toBe("/admin?aba=cartinhas&pagina=2");
    expect(caminhoInternoSeguro("/checkout")).toBe("/checkout");
  });

  it("recusa URL absoluta e esquemas perigosos", () => {
    expect(caminhoInternoSeguro("https://site-falso.com")).toBeNull();
    expect(caminhoInternoSeguro("http://site-falso.com/login")).toBeNull();
    expect(caminhoInternoSeguro("javascript:alert(1)")).toBeNull();
    expect(caminhoInternoSeguro("data:text/html,x")).toBeNull();
  });

  it("recusa formas que o navegador lê como outro domínio", () => {
    expect(caminhoInternoSeguro("//site-falso.com")).toBeNull();
    expect(caminhoInternoSeguro("/\\site-falso.com")).toBeNull();
    expect(caminhoInternoSeguro("/\t/site-falso.com")).toBeNull();
    expect(caminhoInternoSeguro("/ /site-falso.com")).toBeNull();
  });

  it("recusa vazio, ausente e valor gigante", () => {
    expect(caminhoInternoSeguro(null)).toBeNull();
    expect(caminhoInternoSeguro(undefined)).toBeNull();
    expect(caminhoInternoSeguro("")).toBeNull();
    expect(caminhoInternoSeguro("/" + "a".repeat(600))).toBeNull();
  });
});
