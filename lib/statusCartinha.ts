export type StatusCartinha =
  | "disponivel"
  | "apadrinhada"
  | "conferida"
  | "carente"
  | "embrulhado"
  | "reapadrinhado"
  | "entregue"
  | "cancelada";

interface StatusCartinhaInfo {
  label: string;
  /** Classes de fundo+texto para badges/pills */
  badge: string;
  /** Classe de fundo sólido, para indicadores tipo bolinha/barra */
  dot: string;
}

// Única fonte de verdade para as cores de status — usada em /usuario,
// no dashboard do admin e na tabela de cartinhas do admin, pra evitar que
// o mesmo status apareça com cores diferentes dependendo da tela.
export const STATUS_CARTINHA: Record<StatusCartinha, StatusCartinhaInfo> = {
  disponivel:    { label: "Disponível",    badge: "bg-stone-100 text-stone-600",              dot: "bg-stone-400" },
  apadrinhada:   { label: "Apadrinhada",   badge: "bg-stone-200 text-stone-600",              dot: "bg-stone-500" },
  conferida:     { label: "Conferida",     badge: "bg-stone-200 text-stone-600",              dot: "bg-stone-500" },
  carente:       { label: "Carente",       badge: "bg-brand/10 text-brand-dark",              dot: "bg-brand" },
  embrulhado:    { label: "Embrulhado",    badge: "bg-brand-dark/10 text-brand-dark",         dot: "bg-brand-dark" },
  reapadrinhado: { label: "Reapadrinhado", badge: "bg-brand-dark/10 text-brand-dark",         dot: "bg-brand-dark" },
  entregue:      { label: "Entregue",      badge: "bg-verde-natal/10 text-verde-natal",       dot: "bg-verde-natal" },
  cancelada:     { label: "Cancelada",     badge: "bg-vermelho-natal/10 text-vermelho-natal", dot: "bg-vermelho-natal" },
};
