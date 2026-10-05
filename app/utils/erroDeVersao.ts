// Depois de um deploy, quem estava com o site aberto pode pedir arquivos (chunks) ou
// Server Actions que não existem mais. Recarregar a página resolve: baixa a versão nova.
const PADROES_ERRO_DE_VERSAO = [
  /ChunkLoadError/i,
  /Loading (CSS )?chunk [\w-]+ failed/i,
  /Failed to fetch dynamically imported module/i,
  /Importing a module script failed/i,
  /Failed to find Server Action/i,
];

const CHAVE_ULTIMO_RECARREGAMENTO = "recarregadoPorErroDeVersao";
// Se recarregou há pouco e o erro voltou, não é versão antiga: mostra a tela de erro em vez de entrar em loop.
const INTERVALO_MINIMO_MS = 30_000;

export function ehErroDeVersaoAntiga(error: Error) {
  const texto = `${error.name} ${error.message}`;
  return PADROES_ERRO_DE_VERSAO.some((padrao) => padrao.test(texto));
}

// Recarrega a página no máximo uma vez a cada 30s. Retorna true se recarregou.
export function recarregarUmaVez() {
  try {
    const ultimo = Number(sessionStorage.getItem(CHAVE_ULTIMO_RECARREGAMENTO));
    if (ultimo && Date.now() - ultimo < INTERVALO_MINIMO_MS) return false;
    sessionStorage.setItem(CHAVE_ULTIMO_RECARREGAMENTO, String(Date.now()));
  } catch {
    // Sem sessionStorage (aba anônima restrita) não dá pra evitar loop: não recarrega.
    return false;
  }
  window.location.reload();
  return true;
}
