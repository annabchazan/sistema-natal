"use client";

import { useCarrinhoApadrinhamento } from "@/app/hooks/useCarrinhoApadrinhamento";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { buscarCartinhasParaCheckout, finalizarApadrinamento } from "@/app/actions/cartinhas";
import { useToast } from "@/app/components/Toast";
import FotoLightbox from "@/app/components/FotoLightbox";

interface DadosAtuais {
  nome_crianca: string;
  idade: number;
  texto_cartinha: string;
  presente_pedido: string;
  status: string;
  foto_cartinha: string | null;
}

function IconeFechar() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  );
}

function IconeSacola() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 text-brand" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 1 0 9.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1 1 14.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
    </svg>
  );
}

export default function CheckoutClient() {
  const { cartinhas, isLoaded, removerCartinha, limparCarrinho } = useCarrinhoApadrinhamento();
  const { mostrarToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [mensagem, setMensagem] = useState<{
    tipo: "sucesso" | "erro";
    texto: string;
  } | null>(null);
  const [dadosAtuais, setDadosAtuais] = useState<Record<number, DadosAtuais>>({});
  const [fotoAberta, setFotoAberta] = useState<{ src: string; alt: string } | null>(null);
  const [confirmado, setConfirmado] = useState(false);
  const router = useRouter();

  const handleRemover = (id: number) => {
    removerCartinha(id);
    mostrarToast("Cartinha removida do carrinho.", "info");
  };

  useEffect(() => {
    if (isLoaded && cartinhas.length === 0 && !confirmado) {
      router.push("/");
    }
  }, [cartinhas, isLoaded, router, confirmado]);

  useEffect(() => {
    if (!isLoaded || cartinhas.length === 0) return;

    let cancelado = false;
    buscarCartinhasParaCheckout(cartinhas.map((c) => c.id)).then((atuais) => {
      if (cancelado) return;
      setDadosAtuais(Object.fromEntries(atuais.map((c) => [c.id, c])));
    });

    return () => {
      cancelado = true;
    };
  }, [isLoaded, cartinhas]);

  const indisponiveis = cartinhas.filter(
    (c) =>
      dadosAtuais[c.id] &&
      dadosAtuais[c.id].status !== "disponivel" &&
      dadosAtuais[c.id].status !== "carente",
  );

  const handleFinalizarApadrinamento = async () => {
    setIsLoading(true);
    try {
      const idsIndisponiveis = new Set(indisponiveis.map((c) => c.id));
      const ids = cartinhas.map((c) => c.id).filter((id) => !idsIndisponiveis.has(id));

      if (ids.length === 0) {
        setMensagem({
          tipo: "erro",
          texto: "Todas as cartinhas do seu carrinho já foram apadrinhadas por outra pessoa.",
        });
        return;
      }

      const resultado = await finalizarApadrinamento(ids);

      if (resultado.success) {
        setMensagem({ tipo: "sucesso", texto: resultado.message });
        setConfirmado(true);
        limparCarrinho();
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

  if (confirmado) {
    return (
      <div className="min-h-full bg-cream-deep py-14 flex items-center justify-center">
        <div className="max-w-lg mx-auto px-4 text-center">
          <div className="bg-white border border-stone-200 border-t-[3px] border-t-verde-natal rounded-md p-10">
            <div className="w-16 h-16 rounded-full bg-verde-natal/10 flex items-center justify-center mx-auto mb-5">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-8 h-8 text-verde-natal">
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-ink mb-2">
              Você acabou de transformar um Natal!
            </h1>
            <p className="text-stone-600 text-sm leading-6 mb-8">
              {mensagem?.texto} Seu carinho vai chegar até uma criança que
              está contando os dias — obrigada por fazer parte disso. Fique
              de olho no seu e-mail: avisaremos assim que o presente for
              entregue, e você pode acompanhar cada passo pela sua área do
              padrinho.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href="/usuario"
                className="inline-flex items-center justify-center gap-2 bg-ink text-white border border-ink px-5 py-2.5 rounded font-semibold text-[13px] hover:bg-white hover:text-ink transition-colors"
              >
                Ver minha área
              </a>
              <a
                href="/pontos-entrega"
                className="inline-flex items-center justify-center gap-2 bg-transparent text-ink border border-ink px-5 py-2.5 rounded font-semibold text-[13px] hover:bg-ink hover:text-white transition-colors"
              >
                Ver pontos de entrega
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
      <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-[26px] font-bold text-center text-ink tracking-tight mb-9">
            Finalizar Apadrinhamento
          </h1>

          {mensagem && (
            <div
              role="status"
              className={`mb-6 p-4 rounded-md text-center font-semibold text-sm ${
                mensagem.tipo === "sucesso"
                  ? "bg-verde-natal/10 text-verde-natal border border-verde-natal/20"
                  : "bg-vermelho-natal/10 text-vermelho-natal border border-vermelho-natal/20"
              }`}
            >
              {mensagem.texto}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-6 lg:items-stretch">
            <div className="bg-white border border-stone-200 rounded-md p-7 flex flex-col">
              <h2 className="text-sm font-bold text-ink mb-4">
                Resumo das cartinhas
              </h2>

              {indisponiveis.length > 0 && (
                <div role="status" className="mb-4 p-3 rounded bg-vermelho-natal/10 text-vermelho-natal text-[13px] font-semibold">
                  {indisponiveis.length === 1
                    ? "Uma das cartinhas do seu carrinho já foi apadrinhada por outra pessoa."
                    : "Algumas cartinhas do seu carrinho já foram apadrinhadas por outra pessoa."}{" "}
                  Ao confirmar, elas serão desconsideradas automaticamente.
                </div>
              )}

              <div className="flex-1 min-h-[200px] lg:min-h-0 lg:max-h-[400px] overflow-y-auto pr-2 scrollbar-fina">
                {cartinhas.map((cartinha, index) => {
                  const atual = dadosAtuais[cartinha.id];
                  const dados = atual ?? cartinha;
                  const foiApadrinhada =
                    atual && atual.status !== "disponivel" && atual.status !== "carente";
                  const temFoto = dados.foto_cartinha && !dados.foto_cartinha.startsWith("data:");

                  return (
                    <div
                      key={cartinha.id}
                      className={`flex gap-3 border-b border-stone-100 py-3.5 last:border-b-0 ${foiApadrinhada ? "opacity-50" : ""}`}
                    >
                      {temFoto ? (
                        <button
                          type="button"
                          onClick={() =>
                            setFotoAberta({
                              src: dados.foto_cartinha!,
                              alt: `Foto da cartinha de ${dados.nome_crianca}`,
                            })
                          }
                          className="relative w-14 h-14 rounded overflow-hidden shrink-0 group cursor-zoom-in"
                          aria-label={`Ver foto da cartinha de ${dados.nome_crianca} em tela cheia`}
                        >
                          <Image
                            src={dados.foto_cartinha!}
                            alt={dados.nome_crianca}
                            width={56}
                            height={56}
                            className="w-14 h-14 rounded object-cover"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                          <div className="absolute bottom-0.5 right-0.5 bg-black/50 text-white rounded-full p-1 z-10">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-2.5 h-2.5">
                              <circle cx="11" cy="11" r="7" />
                              <path strokeLinecap="round" d="m20 20-3.5-3.5M11 8v6M8 11h6" />
                            </svg>
                          </div>
                        </button>
                      ) : (
                        <div className="w-14 h-14 rounded bg-cream-deep flex items-center justify-center shrink-0">
                          <IconeSacola />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-1.5 gap-2">
                          <h3 className="font-semibold text-sm text-ink">
                            Nº {index + 1} · {dados.nome_crianca}
                            {foiApadrinhada && (
                              <span className="ml-2 text-xs font-normal text-vermelho-natal">
                                (já apadrinhada)
                              </span>
                            )}
                          </h3>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs text-stone-500 whitespace-nowrap">
                              {dados.idade} anos
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemover(cartinha.id)}
                              aria-label={`Remover cartinha de ${dados.nome_crianca} do carrinho`}
                              className="text-stone-400 hover:text-vermelho-natal transition-colors"
                            >
                              <IconeFechar />
                            </button>
                          </div>
                        </div>

                        <p className="text-[13px] text-stone-500 italic mb-2">
                          &quot;{dados.texto_cartinha}&quot;
                        </p>

                        <p className="text-[12.5px] text-stone-500">
                          Pedido: <strong className="text-stone-600">{dados.presente_pedido}</strong>
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

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
                  className="w-full bg-brand-dark text-white py-3.5 rounded font-bold text-[14.5px] hover:bg-brand-darker transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mb-2.5"
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

                <p className="text-[11px] text-stone-500 text-center">
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

        <FotoLightbox
          src={fotoAberta?.src ?? null}
          alt={fotoAberta?.alt ?? ""}
          onClose={() => setFotoAberta(null)}
        />
      </div>
  );
}
