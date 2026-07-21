import { useState, useEffect, useCallback } from "react";

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

  // Carrega do localStorage quando o componente monta.
  // localStorage não existe no server, então o carrinho precisa começar vazio
  // (igual no server e na primeira renderização do client) e só ser preenchido
  // depois, aqui, para não gerar mismatch de hidratação.
  useEffect(() => {
    const saved = localStorage.getItem("carrinhoApadrinhamento");
    if (saved) {
      try {
        // eslint-disable-next-line react-hooks/set-state-in-effect
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

  const temCartinha = useCallback(
    (id: number) => cartinhas.some((c) => c.id === id),
    [cartinhas],
  );

  return {
    cartinhas,
    isLoaded,
    adicionarCartinha,
    removerCartinha,
    limparCarrinho,
    temCartinha,
  };
}
