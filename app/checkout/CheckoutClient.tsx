"use client";

import { useCarrinhoApadrinhamento } from "@/app/hooks/useCarrinhoApadrinhamento";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { finalizarApadrinamento } from "@/app/actions/cartinhas";

export default function CheckoutClient() {
  const { cartinhas, isLoaded, limparCarrinho } = useCarrinhoApadrinhamento();
  const [isLoading, setIsLoading] = useState(false);
  const [mensagem, setMensagem] = useState<{
    tipo: "sucesso" | "erro";
    texto: string;
  } | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && cartinhas.length === 0) {
      router.push("/");
    }
  }, [cartinhas, isLoaded, router]);

  const handleFinalizarApadrinamento = async () => {
    setIsLoading(true);
    try {
      const ids = cartinhas.map((c) => c.id);
      const resultado = await finalizarApadrinamento(ids);

      if (resultado.success) {
        setMensagem({ tipo: "sucesso", texto: resultado.message });
        limparCarrinho();
        setTimeout(() => {
          router.push("/usuario");
        }, 2500);
      } else {
        setMensagem({ tipo: "erro", texto: resultado.message });
      }
    } catch {
      setMensagem({
        tipo: "erro",
        texto: "Erro ao finalizar apadrinhamento.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isLoaded || cartinhas.length === 0) {
    return (
      <div className="min-h-screen bg-linear-to-b from-red-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecionando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-red-50 to-green-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-center text-red-700 mb-8">
            Finalizar Apadrinhamento
          </h1>

          {mensagem && (
            <div
              className={`mb-6 p-4 rounded-lg text-center font-semibold ${
                mensagem.tipo === "sucesso"
                  ? "bg-green-100 text-green-800 border border-green-200"
                  : "bg-red-100 text-red-800 border border-red-200"
              }`}
            >
              {mensagem.texto}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold text-red-700 mb-6">
                Resumo das Cartinhas
              </h2>

              <div className="space-y-4">
                {cartinhas.map((cartinha, index) => (
                  <div
                    key={cartinha.id}
                    className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-red-700 text-lg">
                          {cartinha.nome_crianca}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Idade: {cartinha.idade} anos
                        </p>
                      </div>
                      <span className="bg-red-100 text-red-800 text-xs font-bold px-2 py-1 rounded-full">
                        #{index + 1}
                      </span>
                    </div>

                    <div className="mb-3">
                      <p className="text-sm text-gray-700 italic">
                        {cartinha.texto_cartinha}
                      </p>
                    </div>

                    <div className="bg-green-50 border border-green-200 rounded p-3">
                      <p className="text-sm font-semibold text-green-800">
                        Presente desejado:
                      </p>
                      <p className="text-sm text-green-700">
                        {cartinha.presente_pedido}
                      </p>
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-xs text-gray-500">
                        Data limite de entrega: consulte os pontos de entrega.
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Total de cartinhas:</span>
                  <span className="text-red-600">{cartinhas.length}</span>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-bold text-red-700 mb-4">
                  Próximos Passos
                </h2>

                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      1
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">
                        Confirme o apadrinhamento
                      </h3>
                      <p className="text-sm text-gray-600">
                        Clique no botão abaixo para confirmar seu apadrinhamento.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      2
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">
                        Leve os presentes
                      </h3>
                      <p className="text-sm text-gray-600">
                        Dirija-se a um ponto de entrega com os presentes.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      3
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">
                        Acompanhe sua área
                      </h3>
                      <p className="text-sm text-gray-600">
                        O apadrinhamento ficará vinculado ao seu cadastro.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-bold text-red-700 mb-4">
                  Pontos de Entrega
                </h2>
                <p className="text-gray-700 mb-4">
                  Após confirmar o apadrinhamento, você poderá levar os presentes
                  a qualquer um dos nossos pontos de entrega parceiros.
                </p>
                <a
                  href="/pontos-entrega"
                  className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-semibold transition-colors"
                >
                  Ver Pontos de Entrega
                </a>
              </div>

              <div className="bg-white rounded-lg shadow-lg p-6">
                <button
                  onClick={handleFinalizarApadrinamento}
                  disabled={isLoading}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-4 rounded-lg font-bold text-lg transition-colors flex items-center justify-center space-x-2"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Finalizando...</span>
                    </>
                  ) : (
                    <span>Confirmar Apadrinhamento</span>
                  )}
                </button>

                <p className="text-xs text-gray-500 mt-3 text-center">
                  Ao confirmar, você se compromete a entregar os presentes nos
                  pontos de coleta até a data limite.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-12 bg-gradient-to-r from-red-600 to-green-600 rounded-lg p-8 text-center text-white">
            <h2 className="text-2xl font-bold mb-4">Muito obrigado!</h2>
            <p className="text-lg mb-4">
              Sua generosidade vai transformar o Natal de uma criança especial.
            </p>
            <p className="text-red-100">
              Não é o quanto você dá, mas o quanto de amor você põe no dar.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
