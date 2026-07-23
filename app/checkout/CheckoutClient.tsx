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
      <div className="min-h-full bg-cream-deep flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-ink mx-auto mb-4"></div>
          <p className="text-stone-500">Redirecionando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-cream-deep py-14">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-[26px] font-bold text-center text-ink tracking-tight mb-9">
            Finalizar Apadrinhamento
          </h1>

          {mensagem && (
            <div
              className={`mb-6 p-4 rounded-md text-center font-semibold text-sm ${
                mensagem.tipo === "sucesso"
                  ? "bg-verde-natal/10 text-verde-natal border border-verde-natal/20"
                  : "bg-vermelho-natal/10 text-vermelho-natal border border-vermelho-natal/20"
              }`}
            >
              {mensagem.texto}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-6">
            <div className="bg-white border border-stone-200 rounded-md p-7">
              <h2 className="text-sm font-bold text-ink mb-4">
                Resumo das cartinhas
              </h2>

              <div>
                {cartinhas.map((cartinha, index) => (
                  <div
                    key={cartinha.id}
                    className="border-b border-stone-100 py-3.5 last:border-b-0"
                  >
                    <div className="flex items-start justify-between mb-1.5">
                      <h3 className="font-semibold text-sm text-ink">
                        Nº {index + 1} · {cartinha.nome_crianca}
                      </h3>
                      <span className="text-xs text-stone-400 whitespace-nowrap ml-2">
                        {cartinha.idade} anos
                      </span>
                    </div>

                    <p className="text-[13px] text-stone-500 italic mb-2">
                      &quot;{cartinha.texto_cartinha}&quot;
                    </p>

                    <p className="text-[12.5px] text-stone-400">
                      Pedido: <strong className="text-stone-600">{cartinha.presente_pedido}</strong>
                    </p>
                  </div>
                ))}
              </div>

              <p className="text-[11.5px] text-stone-400 mt-3.5 mb-3">
                Consulte o prazo de entrega de cada cartinha nos Pontos de Entrega.
              </p>

              <div className="pt-2 text-sm font-bold text-ink">
                Total: {cartinhas.length} cartinha{cartinhas.length !== 1 ? "s" : ""}
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-white border border-stone-200 rounded-md p-5">
                <h2 className="text-[13.5px] font-bold text-ink mb-3.5">
                  Próximos passos
                </h2>

                <div className="space-y-3.5">
                  <div className="flex gap-3">
                    <div className="text-[13px] font-bold text-brand-dark flex-shrink-0">01</div>
                    <p className="text-[13px] text-stone-600 leading-5">
                      Confirme o apadrinhamento das cartinhas escolhidas.
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <div className="text-[13px] font-bold text-brand-dark flex-shrink-0">02</div>
                    <p className="text-[13px] text-stone-600 leading-5">
                      Compre e leve o presente até um ponto de entrega, dentro do prazo.
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <div className="text-[13px] font-bold text-brand-dark flex-shrink-0">03</div>
                    <p className="text-[13px] text-stone-600 leading-5">
                      Acompanhe o status da entrega na sua área do padrinho.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-stone-200 rounded-md p-5">
                <h2 className="text-[13.5px] font-bold text-ink mb-2">
                  Pontos de entrega
                </h2>
                <p className="text-[13px] text-stone-500 mb-3.5">
                  Veja endereços e horários disponíveis.
                </p>
                <a
                  href="/pontos-entrega"
                  className="block text-center bg-transparent text-ink border border-ink px-4 py-2.5 rounded font-semibold text-[13px] hover:bg-ink hover:text-white transition-colors"
                >
                  Ver pontos de entrega
                </a>
              </div>

              <div className="bg-white border border-stone-200 rounded-md p-5">
                <button
                  onClick={handleFinalizarApadrinamento}
                  disabled={isLoading}
                  className="w-full bg-brand text-white py-3.5 rounded font-bold text-[14.5px] hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 mb-2.5"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                      <span>Finalizando...</span>
                    </>
                  ) : (
                    <span>Confirmar apadrinhamento</span>
                  )}
                </button>

                <p className="text-[11px] text-stone-400 text-center">
                  Ao confirmar, você se compromete a entregar o presente até o
                  prazo indicado.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-7 bg-ink rounded-md p-6 text-center border-t-[3px] border-brand">
            <p className="text-white text-[15px] font-semibold">
              Obrigado por fazer parte do Natal de uma criança.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
