import { useState, useEffect } from "react";

interface CartinhaApadrinada {
  id: number;
  nome_crianca: string;
  idade: number;
  texto_cartinha: string;
  presente_pedido: string;
  instituicao_id: number;
  tag_id: number | null;
}

export function useCarrinhoApadrinhamento() {
  const [cartinhas, setCartinhas] = useState<CartinhaApadrinada[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Carrega do localStorage quando o componente monta
  useEffect(() => {
    const saved = localStorage.getItem("carrinhoApadrinhamento");
    if (saved) {
      try {
        setCartinhas(JSON.parse(saved));
      } catch (error) {
        console.error("Erro ao carregar cartinhas:", error);
      }
    }
    setIsLoaded(true);
  }, []);

  // Salva no localStorage quando cartinhas mudam
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("carrinhoApadrinhamento", JSON.stringify(cartinhas));
    }
  }, [cartinhas, isLoaded]);

  const adicionarCartinha = (cartinha: CartinhaApadrinada) => {
    setCartinhas((prev) => {
      const exists = prev.some((c) => c.id === cartinha.id);
      if (!exists) {
        return [...prev, cartinha];
      }
      return prev;
    });
  };

  const removerCartinha = (id: number) => {
    setCartinhas((prev) => prev.filter((c) => c.id !== id));
  };

  const limparCarrinho = () => {
    setCartinhas([]);
  };

  const temCartinha = (id: number) => {
    return cartinhas.some((c) => c.id === id);
  };

  return {
    cartinhas,
    isLoaded,
    adicionarCartinha,
    removerCartinha,
    limparCarrinho,
    temCartinha,
  };
}
