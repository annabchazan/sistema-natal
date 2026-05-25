import { describe, it, expect } from "vitest";
import { gerarHashSenha, validarSenha } from "@/lib/auth";

describe("gerarHashSenha", () => {
  it("retorna string no formato salt:hash", () => {
    const hash = gerarHashSenha("minhasenha");
    expect(hash).toContain(":");
    const partes = hash.split(":");
    expect(partes).toHaveLength(2);
    expect(partes[0]).toHaveLength(32); // salt hex de 16 bytes
    expect(partes[1]).toHaveLength(128); // hash hex de 64 bytes
  });

  it("gera hashes diferentes para a mesma senha (salt aleatório)", () => {
    const h1 = gerarHashSenha("mesmasenha");
    const h2 = gerarHashSenha("mesmasenha");
    expect(h1).not.toBe(h2);
  });
});

describe("validarSenha", () => {
  it("retorna true para senha correta", () => {
    const hash = gerarHashSenha("senha123");
    expect(validarSenha("senha123", hash)).toBe(true);
  });

  it("retorna false para senha errada", () => {
    const hash = gerarHashSenha("senha123");
    expect(validarSenha("senhaerrada", hash)).toBe(false);
  });

  it("retorna false para hash vazio", () => {
    expect(validarSenha("qualquer", "semformato")).toBe(false);
  });

  it("suporta formato legado (plain text)", () => {
    // Hash sem ':' cai no fallback de comparação direta
    expect(validarSenha("senhaexata", "senhaexata")).toBe(true);
    expect(validarSenha("outrasenha", "senhaexata")).toBe(false);
  });
});
