export type StatusCartinha =
  | "disponivel"
  | "apadrinhada"
  | "conferida"
  | "carente"
  | "embrulhado"
  | "entregue"
  | "cancelada";

interface StatusCartinhaInfo {
  label: string;
  /** Classes de fundo+texto para badges/pills */
  badge: string;
  /** Classe de fundo sólido, para indicadores tipo bolinha/barra */
  dot: string;
}

// Única fonte de verdade pras cores de status, pra não divergir entre /usuario e o admin.
export const STATUS_CARTINHA: Record<StatusCartinha, StatusCartinhaInfo> = {
  disponivel:    { label: "Disponível",    badge: "bg-stone-100 text-stone-600",              dot: "bg-stone-400" },
  apadrinhada:   { label: "Apadrinhada",   badge: "bg-stone-200 text-stone-600",              dot: "bg-stone-500" },
  conferida:     { label: "Conferida",     badge: "bg-stone-200 text-stone-600",              dot: "bg-stone-500" },
  carente:       { label: "Carente",       badge: "bg-brand/10 text-brand-darker",            dot: "bg-brand" },
  embrulhado:    { label: "Embrulhado",    badge: "bg-brand-dark/10 text-brand-darker",       dot: "bg-brand-dark" },
  entregue:      { label: "Entregue",      badge: "bg-verde-natal/10 text-verde-natal",       dot: "bg-verde-natal" },
  cancelada:     { label: "Cancelada",     badge: "bg-vermelho-natal/10 text-vermelho-natal", dot: "bg-vermelho-natal" },
};

// Só quem já tem padrinho e está no fluxo pode ser marcada como entregue em massa.
// disponivel/carente (sem padrinho) e cancelada ficam de fora: marcar uma cartinha livre
// como entregue a tiraria da home sem que ninguém a tivesse apadrinhado.
export const STATUS_ENTREGAVEIS = ["apadrinhada", "conferida", "embrulhado"] as const;

export const MENSAGEM_STATUS_ENTREGAVEIS =
  "Só cartinhas apadrinhadas, conferidas ou embrulhadas podem ser marcadas como entregues.";

export function podeMarcarComoEntregue(status: string | null | undefined): boolean {
  return (STATUS_ENTREGAVEIS as readonly string[]).includes(status ?? "");
}

// Status em que a cartinha aparece na home e não tem padrinho.
export function statusLivre(status: string | null | undefined): boolean {
  return status === "disponivel" || status === "carente";
}

// Se a cartinha vai para um status "livre" mas ainda tem padrinho (vínculo ou snapshot),
// o vínculo precisa ser solto junto, senão ela fica na lista pública e na área do padrinho antigo.
export function padrinhoDeveSerLiberado(
  statusNovo: string,
  vinculo: { usuarioId: number | null; emailSnapshot: string | null },
): boolean {
  return statusLivre(statusNovo) && (vinculo.usuarioId !== null || Boolean(vinculo.emailSnapshot));
}
