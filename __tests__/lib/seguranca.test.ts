import { describe, it, expect } from "vitest";
import {
  idValido,
  idsValidos,
  minimoSenhaPorTipo,
  sha256Hex,
  textosIguais,
  validarDadosUsuario,
  validarPoliticaSenha,
} from "@/lib/seguranca";
import { detectarTipoImagem } from "@/lib/imagem";

describe("validarPoliticaSenha", () => {
  it("recusa senha curta", () => {
    expect(validarPoliticaSenha("abc123", { min: 8 })).toMatch(/8 caracteres/);
  });

  it("recusa senha comum e repetida", () => {
    expect(validarPoliticaSenha("password123", { min: 8 })).toMatch(/comum/);
    expect(validarPoliticaSenha("aaaaaaaaaa", { min: 8 })).toMatch(/comum/);
  });

  it("recusa senha igual ao e-mail", () => {
    expect(validarPoliticaSenha("ana@teste.com", { min: 8, email: "Ana@Teste.com" })).toMatch(/e-mail/);
  });

  it("recusa senha gigante (evita gastar CPU no scrypt)", () => {
    expect(validarPoliticaSenha("x".repeat(500) + "Ab1", { min: 8 })).toMatch(/no máximo/);
  });

  it("aceita senha boa", () => {
    expect(validarPoliticaSenha("cavalo-bateria-grampo", { min: 8 })).toBeNull();
  });

  it("padrinho e administrador exigem no mínimo 8 caracteres", () => {
    expect(minimoSenhaPorTipo("padrinho")).toBe(8);
    expect(minimoSenhaPorTipo("admin")).toBe(8);
  });
});

describe("validarDadosUsuario", () => {
  const ok = { nome: "Ana Souza", telefone: "(21) 99999-9999", email: "ana@teste.com" };

  it("aceita dados válidos", () => {
    expect(validarDadosUsuario(ok)).toBeNull();
  });

  it("recusa e-mail malformado, telefone curto e nome gigante", () => {
    expect(validarDadosUsuario({ ...ok, email: "sem-arroba" })).toMatch(/e-mail/);
    expect(validarDadosUsuario({ ...ok, telefone: "123" })).toMatch(/telefone/);
    expect(validarDadosUsuario({ ...ok, nome: "a".repeat(101) })).toMatch(/nome/);
  });

  it("recusa campos vazios", () => {
    expect(validarDadosUsuario({ ...ok, nome: "" })).toMatch(/obrigatórios/);
  });
});

describe("ids vindos do cliente", () => {
  it("aceita lista de inteiros positivos e remove duplicados", () => {
    expect(idsValidos([1, 2, 2, 3], 10)).toEqual([1, 2, 3]);
  });

  it("recusa vazio, acima do limite, negativos, decimais e texto", () => {
    expect(idsValidos([], 10)).toBeNull();
    expect(idsValidos([1, 2, 3], 2)).toBeNull();
    expect(idsValidos([-1], 10)).toBeNull();
    expect(idsValidos([1.5], 10)).toBeNull();
    expect(idsValidos(["1; DROP TABLE"], 10)).toBeNull();
    expect(idsValidos("1,2", 10)).toBeNull();
  });

  it("idValido", () => {
    expect(idValido("12")).toBe(12);
    expect(idValido("abc")).toBeNull();
    expect(idValido(0)).toBeNull();
  });
});

describe("helpers", () => {
  it("sha256Hex devolve 64 hex e é determinístico", () => {
    expect(sha256Hex("a")).toMatch(/^[0-9a-f]{64}$/);
    expect(sha256Hex("a")).toBe(sha256Hex("a"));
  });

  it("textosIguais compara sem depender do tamanho", () => {
    expect(textosIguais("Bearer x", "Bearer x")).toBe(true);
    expect(textosIguais("Bearer x", "Bearer y")).toBe(false);
    expect(textosIguais("", "Bearer y")).toBe(false);
  });
});

describe("detectarTipoImagem (assinatura do conteúdo)", () => {
  it("reconhece JPEG, PNG e GIF", () => {
    expect(detectarTipoImagem(new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0]))).toBe("image/jpeg");
    expect(detectarTipoImagem(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0]))).toBe("image/png");
    expect(detectarTipoImagem(new TextEncoder().encode("GIF89a\0\0"))).toBe("image/gif");
  });

  it("recusa HTML, SVG e PDF disfarçados de imagem", () => {
    expect(detectarTipoImagem(new TextEncoder().encode("<html><script>alert(1)</script>"))).toBeNull();
    expect(detectarTipoImagem(new TextEncoder().encode("<svg xmlns='http://www.w3.org/2000/svg'>"))).toBeNull();
    expect(detectarTipoImagem(new TextEncoder().encode("%PDF-1.7 "))).toBeNull();
    expect(detectarTipoImagem(new Uint8Array([]))).toBeNull();
  });
});
