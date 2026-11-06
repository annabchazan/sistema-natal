import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  STATUS_ENTREGAVEIS,
  padrinhoDeveSerLiberado,
  podeMarcarComoEntregue,
  statusLivre,
} from "@/lib/statusCartinha";

describe("statusLivre", () => {
  it("só disponivel e carente são livres", () => {
    expect(statusLivre("disponivel")).toBe(true);
    expect(statusLivre("carente")).toBe(true);
    for (const s of ["apadrinhada", "conferida", "embrulhado", "entregue", "cancelada"]) {
      expect(statusLivre(s)).toBe(false);
    }
    expect(statusLivre(undefined)).toBe(false);
  });
});

describe("padrinhoDeveSerLiberado", () => {
  const comPadrinho = { usuarioId: 5, emailSnapshot: null };
  const semPadrinho = { usuarioId: null, emailSnapshot: null };

  it("libera quando o status vira livre e há vínculo", () => {
    expect(padrinhoDeveSerLiberado("carente", comPadrinho)).toBe(true);
    expect(padrinhoDeveSerLiberado("disponivel", comPadrinho)).toBe(true);
  });
  it("libera também quando só resta o snapshot (conta já excluída)", () => {
    expect(padrinhoDeveSerLiberado("disponivel", { usuarioId: null, emailSnapshot: "a@b.com" })).toBe(true);
  });
  it("não faz nada sem padrinho ou com status não livre", () => {
    expect(padrinhoDeveSerLiberado("disponivel", semPadrinho)).toBe(false);
    expect(padrinhoDeveSerLiberado("conferida", comPadrinho)).toBe(false);
  });
});

describe("podeMarcarComoEntregue", () => {
  it("aceita só apadrinhada, conferida e embrulhado", () => {
    expect([...STATUS_ENTREGAVEIS]).toEqual(["apadrinhada", "conferida", "embrulhado"]);
    for (const s of ["apadrinhada", "conferida", "embrulhado"]) {
      expect(podeMarcarComoEntregue(s)).toBe(true);
    }
  });

  it("rejeita disponivel e carente (sem padrinho), entregue e cancelada", () => {
    for (const s of ["disponivel", "carente", "entregue", "cancelada"]) {
      expect(podeMarcarComoEntregue(s)).toBe(false);
    }
  });

  it("rejeita valores vazios, nulos e desconhecidos", () => {
    expect(podeMarcarComoEntregue(null)).toBe(false);
    expect(podeMarcarComoEntregue(undefined)).toBe(false);
    expect(podeMarcarComoEntregue("")).toBe(false);
    expect(podeMarcarComoEntregue("qualquer")).toBe(false);
  });
});

// O projeto não tem testes de componente; confere o conteúdo do arquivo da tabela.
describe("tabela de cartinhas (seleção para entrega)", () => {
  const tabela = readFileSync(
    join(process.cwd(), "app", "components", "admin", "Cartinha", "TabelaCartinhas.tsx"),
    "utf8",
  );

  it("usa a mesma regra do servidor para mostrar a caixa de seleção", () => {
    expect(tabela).toContain("podeMarcarComoEntregue(item.status)");
    expect(tabela).not.toMatch(/item\.status !== "entregue" && item\.status !== "cancelada"\s*;/);
  });

  it("explica ao usuário que 'Selecionar todas' marca só as aptas e mostra quantas", () => {
    expect(tabela).toContain("apadrinhadas, conferidas ou embrulhadas");
    expect(tabela).toContain("Selecionar todas");
    expect(tabela).toContain("{idsSelecionaveis.length} de {dadosFiltrados.length}");
  });

  it("a confirmação e a barra de seleção dizem que as demais não serão alteradas", () => {
    expect(tabela).toContain("não serão alteradas");
  });
});
