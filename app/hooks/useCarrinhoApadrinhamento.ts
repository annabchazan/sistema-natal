import { useCallback, useEffect, useSyncExternalStore } from "react";

interface CartinhaApadrinada {
  id: number;
  nome_crianca: string;
  idade: number;
  texto_cartinha: string;
  presente_pedido: string;
  instituicao_id: number;
  tag_id: number | null;
  foto_cartinha?: string | null;
}

const STORAGE_KEY = "carrinhoApadrinhamento";
const EMPTY_CARTINHAS: CartinhaApadrinada[] = [];

// Estado a nível de módulo (não de componente) para refletir add/remove entre Header e MiniCart sem reload.
let cartinhas: CartinhaApadrinada[] = EMPTY_CARTINHAS;
let carregadoDoStorage = false;
const listeners = new Set<() => void>();

function notificar() {
  for (const listener of listeners) listener();
}

function persistir() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cartinhas));
}

function carregarDoStorage() {
  if (carregadoDoStorage) return;
  carregadoDoStorage = true;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      cartinhas = JSON.parse(saved);
    }
  } catch (error) {
    console.error("Erro ao carregar cartinhas:", error);
  }
  notificar();
}

function getIsLoadedSnapshot() {
  return carregadoDoStorage;
}

function getServerIsLoadedSnapshot() {
  return false;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return cartinhas;
}

function getServerSnapshot() {
  return EMPTY_CARTINHAS;
}

function adicionarCartinha(cartinha: CartinhaApadrinada) {
  if (cartinhas.some((c) => c.id === cartinha.id)) return;
  cartinhas = [...cartinhas, cartinha];
  persistir();
  notificar();
}

function removerCartinha(id: number) {
  cartinhas = cartinhas.filter((c) => c.id !== id);
  persistir();
  notificar();
}

function limparCarrinho() {
  cartinhas = EMPTY_CARTINHAS;
  persistir();
  notificar();
}

export function useCarrinhoApadrinhamento() {
  const cartinhasAtual = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  const isLoaded = useSyncExternalStore(
    subscribe,
    getIsLoadedSnapshot,
    getServerIsLoadedSnapshot,
  );

  // Carrega do localStorage só depois de montar, pra não gerar mismatch de hidratação.
  useEffect(() => {
    carregarDoStorage();
  }, []);

  const temCartinha = useCallback(
    (id: number) => cartinhasAtual.some((c) => c.id === id),
    [cartinhasAtual],
  );

  return {
    cartinhas: cartinhasAtual,
    isLoaded,
    adicionarCartinha,
    removerCartinha,
    limparCarrinho,
    temCartinha,
  };
}
