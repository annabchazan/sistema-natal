"use client";

import { finalizarApadrinamento } from "@/app/actions/cartinhas";
import { useCarrinhoApadrinhamento } from "@/app/hooks/useCarrinhoApadrinhamento";
import { useEffect, useState } from "react";

export default function MiniCartApadrinhamento() {
  const { cartinhas, removerCartinha, limparCarrinho } =
    useCarrinhoApadrinhamento();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mensagem, setMensagem] = useState<{
    tipo: "sucesso" | "erro";
    texto: string;
  } | null>(null);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const handleFinalizarApadrinamento = async () => {
    setIsLoading(true);
    try {
      const ids = cartinhas.map((c) => c.id);
      const resultado = await finalizarApadrinamento(ids);

      if (resultado.success) {
        setMensagem({ tipo: "sucesso", texto: resultado.message });
        limparCarrinho();
        setTimeout(() => {
          setIsOpen(false);
          setMensagem(null);
        }, 2000);
      } else {
        setMensagem({ tipo: "erro", texto: resultado.message });
      }
    } catch {
      setMensagem({
        tipo: "erro",
        texto: "Erro ao finalizar apadrinamento",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isLoaded) return null;

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 bg-ink hover:bg-stone-600 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-[0_8px_24px_rgba(30,27,23,.25)] transition-all z-40"
        aria-label="Carrinho de apadrinhamento"
      >
        <div className="relative">
          <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth="1.8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
          </svg>
          {cartinhas.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-brand text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {cartinhas.length}
            </span>
          )}
        </div>
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-6 bg-white rounded-md shadow-[0_8px_24px_rgba(30,27,23,.18)] border border-stone-200 w-96 max-h-96 flex flex-col z-50">
          <div className="p-4 border-b border-stone-100 flex items-center justify-between">
            <h3 className="text-[13.5px] font-bold text-ink">Cartinhas escolhidas</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-stone-400 hover:text-ink text-xl leading-none"
            >
              ×
            </button>
          </div>

          {mensagem && (
            <div
              className={`p-4 text-center text-sm font-semibold ${
                mensagem.tipo === "sucesso"
                  ? "bg-verde-natal/10 text-verde-natal"
                  : "bg-vermelho-natal/10 text-vermelho-natal"
              }`}
            >
              {mensagem.tipo === "sucesso" ? "✓" : "×"} {mensagem.texto}
            </div>
          )}

          {cartinhas.length === 0 ? (
            <div className="p-8 text-center text-stone-400">
              <p className="text-[12.5px]">Nenhuma cartinha selecionada ainda</p>
            </div>
          ) : (
            <div className="overflow-y-auto flex-1 p-4 space-y-3">
              {cartinhas.map((cartinha) => (
                <div
                  key={cartinha.id}
                  className="border border-stone-200 rounded-md p-3 bg-cream-deep"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-bold text-ink text-sm">
                        {cartinha.nome_crianca}
                      </h4>
                      <p className="text-xs text-stone-400 mt-1">
                        Idade: {cartinha.idade} anos
                      </p>
                      <p className="text-xs text-verde-natal font-semibold mt-2">
                        {cartinha.presente_pedido}
                      </p>
                    </div>
                    <button
                      onClick={() => removerCartinha(cartinha.id)}
                      className="ml-2 text-stone-400 hover:text-vermelho-natal font-bold text-lg leading-none"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {cartinhas.length > 0 && (
            <div className="border-t border-stone-100 p-4 space-y-2">
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold text-sm text-ink">Total:</span>
                <span className="text-sm font-bold text-ink">
                  {cartinhas.length} cartinha{cartinhas.length !== 1 ? "s" : ""}
                </span>
              </div>
              <button
                onClick={handleFinalizarApadrinamento}
                disabled={isLoading}
                className="w-full bg-brand border border-brand text-white py-2.5 rounded font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {isLoading ? "Finalizando..." : "Finalizar Apadrinamento"}
              </button>
              <button
                onClick={() => limparCarrinho()}
                className="w-full bg-white border border-stone-200 text-stone-500 py-2.5 rounded font-semibold text-sm hover:bg-cream-deep transition-colors"
              >
                Limpar Carrinho
              </button>
            </div>
          )}
        </div>
      )}

      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
