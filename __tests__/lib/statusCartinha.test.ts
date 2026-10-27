import { describe, it, expect } from "vitest";
import { padrinhoDeveSerLiberado, statusLivre } from "@/lib/statusCartinha";

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
