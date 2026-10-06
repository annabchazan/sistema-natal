import { describe, it, expect } from "vitest";
import { dataISO, formatarDataCurta, hojeNoBrasil, diasAtePrazo } from "@/app/utils/datas";

// Como o mysql2 entrega uma coluna DATE de 07/11/2026.
const prazoDoBanco = new Date(Date.UTC(2026, 10, 7));

describe("dataISO", () => {
  it("converte a data do banco pro formato do <input type=date>", () => {
    expect(dataISO(prazoDoBanco)).toBe("2026-11-07");
    expect(dataISO("2026-11-07")).toBe("2026-11-07");
  });

  it("devolve vazio sem data ou com data inválida", () => {
    expect(dataISO(null)).toBe("");
    expect(dataISO(undefined)).toBe("");
    expect(dataISO("não é data")).toBe("");
  });
});

describe("formatarDataCurta", () => {
  it("mostra o mesmo dia do banco, sem cair pro dia anterior no Brasil", () => {
    expect(formatarDataCurta(prazoDoBanco)).toBe("07/11/2026");
    expect(formatarDataCurta("2026-11-07T00:00:00.000Z")).toBe("07/11/2026");
  });

  it("devolve vazio sem data", () => {
    expect(formatarDataCurta(null)).toBe("");
  });
});

describe("hojeNoBrasil / diasAtePrazo", () => {
  it("às 22h no Brasil ainda é o mesmo dia (em UTC já seria o seguinte)", () => {
    const dia6As22hNoBrasil = new Date("2026-11-07T01:00:00Z");
    expect(hojeNoBrasil(dia6As22hNoBrasil)).toBe("2026-11-06");
    expect(diasAtePrazo(prazoDoBanco, dia6As22hNoBrasil)).toBe(1);
  });

  it("vence hoje = 0, vencido = negativo", () => {
    expect(diasAtePrazo(prazoDoBanco, new Date("2026-11-07T15:00:00Z"))).toBe(0);
    expect(diasAtePrazo(prazoDoBanco, new Date("2026-11-08T15:00:00Z"))).toBe(-1);
  });

  it("sem prazo devolve null", () => {
    expect(diasAtePrazo(null)).toBeNull();
  });
});
