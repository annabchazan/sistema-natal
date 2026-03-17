"use client";

import { useCarrinhoApadrinhamento } from "@/app/hooks/useCarrinhoApadrinhamento";
import { useState, useEffect } from "react";

interface Cartinha {
  id: number;
  nome_crianca: string;
  idade: number;
  texto_cartinha: string;
  presente_pedido: string;
  instituicao_id: number;
  tag_id: number | null;
  numero_sequencial?: number;
  foto_cartinha?: string | null;
  data_limite_entrega?: string | null;
}

export default function ListaCartinhasHome({
  cartinhas,
}: {
  cartinhas: Cartinha[];
}) {
  const { adicionarCartinha, removerCartinha, temCartinha } =
    useCarrinhoApadrinhamento();
  const [carrinhoAtualizado, setCarrinhoAtualizado] = useState<{
    [key: number]: boolean;
  }>({});
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
    // Atualizar o estado visual com base no carrinho
    const estado: { [key: number]: boolean } = {};
    cartinhas.forEach((c) => {
      estado[c.id] = temCartinha(c.id);
    });
    setCarrinhoAtualizado(estado);
  }, []);

  const handleApadrinhar = (cartinha: Cartinha) => {
    if (carrinhoAtualizado[cartinha.id]) {
      removerCartinha(cartinha.id);
      setCarrinhoAtualizado((prev) => ({
        ...prev,
        [cartinha.id]: false,
      }));
    } else {
      adicionarCartinha(cartinha);
      setCarrinhoAtualizado((prev) => ({
        ...prev,
        [cartinha.id]: true,
      }));
    }
  };
  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-red-50 to-green-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-center text-red-700 mb-2">
          🎄 Cartinhas de Natal 🎄
        </h1>
        <p className="text-center text-gray-600 mb-12">
          {cartinhas.length} {cartinhas.length === 1 ? "cartinha" : "cartinhas"}{" "}
          cadastrada{cartinhas.length === 1 ? "" : "s"}
        </p>

        {cartinhas.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-xl text-gray-500">
              Nenhuma cartinha cadastrada ainda 😢
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cartinhas.map((cartinha) => (
              <div
                key={cartinha.id}
                className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow p-6 border-l-4 border-red-500 relative"
              >
                {/* Badge do número sequencial */}
                {cartinha.numero_sequencial !== undefined && (
                  <div className="absolute top-3 right-3 bg-red-600 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold text-lg">
                    #{cartinha.numero_sequencial}
                  </div>
                )}

                {/* Foto da cartinha */}
                {cartinha.foto_cartinha && (
                  <div className="mb-4 flex justify-center">
                    <img
                      src={cartinha.foto_cartinha}
                      alt={`Foto da cartinha de ${cartinha.nome_crianca}`}
                      className="w-32 h-24 rounded-lg object-cover border-4 border-red-200 shadow-md"
                    />
                  </div>
                )}

                <div className="mb-4">
                  <h2 className="text-2xl font-bold text-red-700 mb-2">
                    {cartinha.nome_crianca}
                  </h2>
                  <p className="text-sm text-gray-500">
                    <span className="font-semibold">Idade:</span>{" "}
                    {cartinha.idade} anos
                  </p>
                  {cartinha.data_limite_entrega && (
                    <p className="text-sm text-orange-600 mt-1">
                      <span className="font-semibold">📅 Entregar até:</span>{" "}
                      {new Date(
                        cartinha.data_limite_entrega,
                      ).toLocaleDateString("pt-BR")}
                    </p>
                  )}
                </div>

                <div className="mb-4">
                  <p className="text-gray-700 line-clamp-3">
                    <span className="font-semibold block mb-1">Mensagem:</span>
                    {cartinha.texto_cartinha}
                  </p>
                </div>

                <div className="bg-green-50 p-3 rounded mb-4">
                  <p className="text-green-800">
                    <span className="font-semibold">Presente desejado:</span>
                    <br />
                    {cartinha.presente_pedido}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleApadrinhar(cartinha)}
                    className={`flex-1 py-2 px-4 rounded font-semibold transition-all ${
                      carrinhoAtualizado[cartinha.id]
                        ? "bg-green-600 hover:bg-green-700 text-white"
                        : "bg-red-600 hover:bg-red-700 text-white"
                    }`}
                  >
                    {carrinhoAtualizado[cartinha.id]
                      ? "✓ Apadinhada"
                      : "🎁 Apadrinhar"}
                  </button>
                </div>

                <div className="text-xs text-gray-400 mt-3">
                  ID: {cartinha.id}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
