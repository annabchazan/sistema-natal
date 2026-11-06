// Versão vigente da Política de Privacidade. Ao mudar o texto de forma relevante, suba
// este valor: todo usuário com versão diferente volta a ver a tela de aceite ao entrar.
export const VERSAO_POLITICA = "1.0";

export const MSG_ACEITE_OBRIGATORIO =
  "Para continuar, é preciso ler e concordar com a Política de Privacidade.";

// Quem nunca aceitou (versão nula) ou aceitou outra versão precisa aceitar de novo.
export function precisaAceitarPolitica(
  usuario: { politica_versao?: string | null } | null | undefined,
): boolean {
  return usuario?.politica_versao !== VERSAO_POLITICA;
}

// Destino do redirecionamento para a tela de aceite, preservando para onde a pessoa ia.
export function caminhoAceitePolitica(destino: string): string {
  return `/aceitar-politica?next=${encodeURIComponent(destino)}`;
}
