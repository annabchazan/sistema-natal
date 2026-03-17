"use client";

import { useCarrinhoApadrinhamento } from "@/app/hooks/useCarrinhoApadrinhamento";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Header() {
  const { cartinhas, removerCartinha, limparCarrinho } =
    useCarrinhoApadrinhamento();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const handleIrParaCheckout = () => {
    setIsOpen(false);
    router.push("/checkout");
  };

  if (!isLoaded) return null;

  return (
    <>
      {/* Header */}
      <header className="bg-red-600 text-white shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          {/* Logo/Título */}
          <div className="flex items-center gap-2">
            <span className="text-3xl">🎄</span>
            <h1 className="text-2xl font-bold">Sistema Natal</h1>
          </div>

          {/* Botão do Carrinho */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="relative flex items-center gap-2 bg-red-700 hover:bg-red-800 px-4 py-2 rounded-lg transition-colors"
          >
            <span className="text-2xl">🎁</span>
            <span className="font-semibold">
              {cartinhas.length > 0 ? cartinhas.length : "Carrinho"}
            </span>
            {cartinhas.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                {cartinhas.length}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Painel do Carrinho */}
      {isOpen && (
        <div className="fixed right-0 top-20 bg-white rounded-b-lg shadow-2xl border border-gray-200 w-96 max-h-96 flex flex-col z-50">
          {/* Header do Carrinho */}
          <div className="bg-red-600 text-white p-4 flex items-center justify-between">
            <h3 className="text-lg font-bold">Cartinhas Apadrinadas 🎄</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:text-gray-200 text-xl"
            >
              ✕
            </button>
          </div>

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
                onClick={handleIrParaCheckout}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded font-semibold transition-colors"
              >
                🎄 Ir para Checkout
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
