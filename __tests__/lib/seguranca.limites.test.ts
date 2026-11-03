import { describe, it, expect } from "vitest";
import {
  LIMITE_EMAIL,
  LIMITE_NOME,
  SENHA_MAX,
  idsValidos,
  validarDadosUsuario,
  validarPoliticaSenha,
} from "@/lib/seguranca";

// Testes de borda: o valor exatamente no limite passa, um a mais não passa.

describe("validarPoliticaSenha (limites)", () => {
  it("aceita senha com exatamente o tamanho mínimo e recusa uma a menos", () => {
    expect(validarPoliticaSenha("abcdefg1", { min: 8 })).toBeNull();
    expect(validarPoliticaSenha("abcdef1", { min: 8 })).toBe("A senha deve ter pelo menos 8 caracteres.");
  });

  it("aceita senha com exatamente SENHA_MAX caracteres", () => {
    expect(SENHA_MAX).toBe(128);
    expect(validarPoliticaSenha("ab".repeat(64), { min: 8 })).toBeNull();
  });

  it("recusa senha com SENHA_MAX + 1 caracteres, com a mensagem do máximo", () => {
    expect(validarPoliticaSenha("ab".repeat(64) + "c", { min: 8 })).toBe(
      "A senha deve ter no máximo 128 caracteres.",
    );
  });

  it("a regra de senha comum ignora maiúsculas e minúsculas", () => {
    expect(validarPoliticaSenha("PassWord123", { min: 8 })).toMatch(/comum/);
    expect(validarPoliticaSenha("NATAL2026", { min: 8 })).toMatch(/comum/);
  });

  it("recusa senhas da lista de comuns, de pontas diferentes da lista", () => {
    for (const s of ["12345678", "qwerty123", "trocar123", "semprecrianca", "senha123"]) {
      expect(validarPoliticaSenha(s, { min: 8 })).toMatch(/comum/);
    }
  });

  it("recusa senha de um caractere só repetido, de qualquer tamanho", () => {
    expect(validarPoliticaSenha("aaaaaaaa", { min: 8 })).toMatch(/comum/);
    expect(validarPoliticaSenha("zzzzzzzzzzzzzzzz", { min: 8 })).toMatch(/comum/);
    expect(validarPoliticaSenha("77777777", { min: 8 })).toMatch(/comum/);
  });

  it("não confunde senha com um caractere diferente no começo, meio ou fim com 'repetida'", () => {
    expect(validarPoliticaSenha("baaaaaaa", { min: 8 })).toBeNull();
    expect(validarPoliticaSenha("aaaabaaa", { min: 8 })).toBeNull();
    expect(validarPoliticaSenha("aaaaaaab", { min: 8 })).toBeNull();
  });

  it("recusa senha igual ao e-mail ignorando caixa e espaços do e-mail", () => {
    const msg = "A senha não pode ser igual ao e-mail.";
    expect(validarPoliticaSenha("ana@teste.com", { min: 8, email: "ana@teste.com" })).toBe(msg);
    expect(validarPoliticaSenha("Ana@Teste.com", { min: 8, email: "  ana@teste.com  " })).toBe(msg);
    expect(validarPoliticaSenha("ana@teste.com", { min: 8, email: "ANA@TESTE.COM" })).toBe(msg);
  });

  it("aceita senha parecida com o e-mail, mas não igual", () => {
    expect(validarPoliticaSenha("ana@teste.com1", { min: 8, email: "ana@teste.com" })).toBeNull();
  });

  it("sem e-mail informado, não aplica a regra do e-mail", () => {
    expect(validarPoliticaSenha("ana@teste.com", { min: 8 })).toBeNull();
  });

  it("a primeira regra violada define a mensagem (curta antes de comum)", () => {
    expect(validarPoliticaSenha("aaaa", { min: 8 })).toMatch(/pelo menos/);
  });
});

describe("validarDadosUsuario (limites)", () => {
  const ok = { nome: "Ana Souza", telefone: "(21) 99999-9999", email: "ana@teste.com" };

  it("aceita nome com exatamente LIMITE_NOME caracteres e recusa um a mais", () => {
    expect(LIMITE_NOME).toBe(100);
    expect(validarDadosUsuario({ ...ok, nome: "a".repeat(100) })).toBeNull();
    expect(validarDadosUsuario({ ...ok, nome: "a".repeat(101) })).toBe(
      "O nome deve ter no máximo 100 caracteres.",
    );
  });

  it("aceita e-mail com exatamente LIMITE_EMAIL caracteres e recusa um a mais", () => {
    expect(LIMITE_EMAIL).toBe(100);
    const sufixo = "@teste.com"; // 10 caracteres
    const noLimite = "a".repeat(100 - sufixo.length) + sufixo;
    expect(noLimite).toHaveLength(100);
    expect(validarDadosUsuario({ ...ok, email: noLimite })).toBeNull();

    const passou = "a" + noLimite;
    expect(validarDadosUsuario({ ...ok, email: passou })).toBe("Informe um e-mail válido.");
  });

  it("recusa e-mail curto mas malformado, mesmo dentro do limite de tamanho", () => {
    for (const email of ["sem-arroba", "a@b", "a b@c.com", "@teste.com", "ana@.com"]) {
      expect(validarDadosUsuario({ ...ok, email })).toBe("Informe um e-mail válido.");
    }
  });

  it("telefone: aceita 10 e 11 dígitos, recusa 9 e 12", () => {
    const msg = "Informe um telefone válido com DDD.";
    expect(validarDadosUsuario({ ...ok, telefone: "2133334444" })).toBeNull(); // 10
    expect(validarDadosUsuario({ ...ok, telefone: "21999998888" })).toBeNull(); // 11
    expect(validarDadosUsuario({ ...ok, telefone: "213333444" })).toBe(msg); // 9
    expect(validarDadosUsuario({ ...ok, telefone: "219999988887" })).toBe(msg); // 12
  });

  it("telefone: aceita exatamente 20 caracteres e recusa 21, mesmo com 11 dígitos", () => {
    const base = "(21) 99999-9999"; // 15 caracteres, 11 dígitos
    const com20 = base + " ".repeat(5);
    const com21 = base + " ".repeat(6);
    expect(com20).toHaveLength(20);
    expect(com21).toHaveLength(21);
    expect(validarDadosUsuario({ ...ok, telefone: com20 })).toBeNull();
    expect(validarDadosUsuario({ ...ok, telefone: com21 })).toBe("Informe um telefone válido com DDD.");
  });

  it("a mensagem de campos obrigatórios vale para cada campo vazio", () => {
    const msg = "Nome, telefone e e-mail são obrigatórios.";
    expect(validarDadosUsuario({ ...ok, nome: "" })).toBe(msg);
    expect(validarDadosUsuario({ ...ok, telefone: "" })).toBe(msg);
    expect(validarDadosUsuario({ ...ok, email: "" })).toBe(msg);
  });
});

describe("idsValidos (limites)", () => {
  it("aceita lista com exatamente max itens e recusa max + 1", () => {
    expect(idsValidos([1, 2], 2)).toEqual([1, 2]);
    expect(idsValidos([1, 2, 3], 2)).toBeNull();
  });

  it("recusa lista vazia", () => {
    expect(idsValidos([], 5)).toBeNull();
  });

  it("recusa a lista inteira se um único id for inválido, em qualquer posição", () => {
    expect(idsValidos([1, -1], 10)).toBeNull();
    expect(idsValidos([-1, 1], 10)).toBeNull();
    expect(idsValidos([1, 0], 10)).toBeNull();
    expect(idsValidos([1, "abc"], 10)).toBeNull();
    expect(idsValidos([1, 1.5, 2], 10)).toBeNull();
  });

  it("recusa o id 0 sozinho, mas aceita o id 1", () => {
    expect(idsValidos([0], 10)).toBeNull();
    expect(idsValidos([1], 10)).toEqual([1]);
  });

  it("recusa inteiros fora da faixa segura", () => {
    expect(idsValidos([Number.MAX_SAFE_INTEGER + 1], 10)).toBeNull();
    expect(idsValidos([Number.MAX_SAFE_INTEGER], 10)).toEqual([Number.MAX_SAFE_INTEGER]);
  });

  it("converte ids numéricos em texto, mantendo a ordem e removendo duplicados", () => {
    expect(idsValidos(["3", 1, "3", 2], 10)).toEqual([3, 1, 2]);
  });

  it("recusa o que não é lista", () => {
    for (const v of [null, undefined, 5, "1,2", { 0: 1, length: 1 }]) {
      expect(idsValidos(v, 10)).toBeNull();
    }
  });
});
