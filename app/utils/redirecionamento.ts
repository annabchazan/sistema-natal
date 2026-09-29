// Valida o destino pós-login vindo da URL (?next=). Só aceita caminho interno do próprio
// site (ex.: "/admin?aba=1"); qualquer coisa que possa sair do domínio vira null.
export function caminhoInternoSeguro(valor: string | null | undefined): string | null {
  if (!valor || valor.length > 500) return null;
  // Precisa começar com uma única "/"; "//host" e "/\host" são lidos pelo navegador como outro domínio.
  if (!valor.startsWith("/") || valor.startsWith("//") || valor.startsWith("/\\")) return null;
  // Sem barra invertida, caractere de controle ou espaço (usados pra confundir o parser de URL).
  if (/[\\\u0000-\u001f\u007f\s]/.test(valor)) return null;
  return valor;
}
