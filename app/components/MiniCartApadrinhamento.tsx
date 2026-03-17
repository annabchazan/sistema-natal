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
    } catch (error) {
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
      {/* Botão flutuante do minicart */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 bg-red-600 hover:bg-red-700 text-white rounded-full w-16 h-16 flex items-center justify-center shadow-lg transition-all z-40"
      >
        <div className="relative">
          <span className="text-2xl">🎁</span>
          {cartinhas.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
              {cartinhas.length}
            </span>
          )}
        </div>
      </button>

      {/* Painel do minicart */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 bg-white rounded-lg shadow-2xl border border-gray-200 w-96 max-h-96 flex flex-col z-50">
          {/* Header */}
          <div className="bg-red-600 text-white p-4 rounded-t-lg flex items-center justify-between">
            <h3 className="text-lg font-bold">Cartinhas Apadrinadas 🎄</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:text-gray-200"
            >
              ✕
            </button>
          </div>

          {/* Mensagem */}
          {mensagem && (
            <div
              className={`p-4 text-center font-semibold ${
                mensagem.tipo === "sucesso"
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {mensagem.tipo === "sucesso" ? "✓" : "✕"} {mensagem.texto}
            </div>
          )}

          {/* Conteúdo */}
          {cartinhas.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p className="text-sm">Nenhuma cartinha selecionada ainda</p>
            </div>
          ) : (
            <div className="overflow-y-auto flex-1 p-4 space-y-3">
              {cartinhas.map((cartinha) => (
                <div
                  key={cartinha.id}
                  className="border border-gray-200 rounded-lg p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-bold text-red-700">
                        {cartinha.nome_crianca}
                      </h4>
                      <p className="text-xs text-gray-600 mt-1">
                        Idade: {cartinha.idade} anos
                      </p>
                      <p className="text-xs text-green-700 font-semibold mt-2">
                        {cartinha.presente_pedido}
                      </p>
                    </div>
                    <button
                      onClick={() => removerCartinha(cartinha.id)}
                      className="ml-2 text-red-500 hover:text-red-700 font-bold"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Footer */}
          {cartinhas.length > 0 && (
            <div className="border-t p-4 space-y-2">
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold">Total:</span>
                <span className="text-lg font-bold text-red-600">
                  {cartinhas.length} cartinha{cartinhas.length !== 1 ? "s" : ""}
                </span>
              </div>
              <button
                onClick={handleFinalizarApadrinamento}
                disabled={isLoading}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-2 rounded font-semibold transition-colors"
              >
                {isLoading ? "Finalizando..." : "✓ Finalizar Apadrinamento"}
              </button>
              <button
                onClick={() => limparCarrinho()}
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 rounded font-semibold transition-colors"
              >
                Limpar Carrinho
              </button>
            </div>
          )}
        </div>
      )}

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-20 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
