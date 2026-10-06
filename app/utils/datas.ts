// Campos DATE do MySQL (ex.: data_limite_entrega) chegam como meia-noite UTC.
// Formatados no fuso do navegador, no Brasil (UTC-3) viram o dia anterior;
// por isso toda leitura de data "pura" aqui usa UTC.

const FUSO_DA_CAMPANHA = "America/Sao_Paulo";
const UM_DIA_MS = 24 * 60 * 60 * 1000;

type ValorData = string | Date | null | undefined;

// "AAAA-MM-DD", o formato do <input type="date">. Vazio quando não há data válida.
export function dataISO(valor: ValorData): string {
  if (!valor) return "";
  const data = new Date(valor);
  return Number.isNaN(data.getTime()) ? "" : data.toISOString().slice(0, 10);
}

// "07/11/2026"
export function formatarDataCurta(valor: ValorData): string {
  const iso = dataISO(valor);
  return iso ? new Date(iso).toLocaleDateString("pt-BR", { timeZone: "UTC" }) : "";
}

// Hoje no Brasil, em "AAAA-MM-DD" (en-CA formata assim).
export function hojeNoBrasil(agora: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: FUSO_DA_CAMPANHA }).format(agora);
}

// Dias entre hoje (no Brasil) e o prazo: 0 = vence hoje, negativo = vencido.
export function diasAtePrazo(valor: ValorData, agora: Date = new Date()): number | null {
  const prazo = dataISO(valor);
  if (!prazo) return null;
  return Math.round((Date.parse(prazo) - Date.parse(hojeNoBrasil(agora))) / UM_DIA_MS);
}
