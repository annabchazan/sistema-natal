"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";

import { useInstalarApp } from "@/app/hooks/useInstalarApp";
// Importado aqui pra o módulo rodar em toda página, logado ou não (ver instalacaoApp.ts).
import "@/app/utils/instalacaoApp";

const CLASSE_BOTAO =
  "mt-3 w-full bg-brand-dark text-white py-2.5 rounded font-bold text-[14px] hover:bg-brand-darker transition-colors";

/**
 * Faixa fixa no rodapé (só celular) convidando padrinhos e equipe logados a
 * instalar o app. Visitante não vê: o foco dele é conhecer as cartinhas.
 * Android abre o diálogo nativo; iPhone não tem isso, então mostra o passo a
 * passo do Safari. A coluna da direita fica livre pro botão do WhatsApp.
 */
export default function InstalarAppBanner({ logado }: { logado: boolean }) {
  const { plataforma, instalar, dispensarBanner } = useInstalarApp();
  const [passosAbertos, setPassosAbertos] = useState(false);
  const pathname = usePathname();

  // Fluxos de senha: a pessoa está no meio de outra coisa.
  if (!logado || plataforma === "nenhuma" || pathname?.endsWith("-senha")) return null;

  return (
    <div
      role="region"
      aria-label="Instalar o aplicativo"
      className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-brand bg-white py-3 pl-4 pr-24 shadow-[0_-2px_8px_rgba(30,27,23,.08)] sm:hidden print:hidden"
    >
      <div className="flex items-start gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element -- ícone estático de 40px, sem ganho com next/image */}
        <img src="/pwa-192.png" alt="" width={40} height={40} className="shrink-0 rounded-lg" />
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-bold text-ink">Instale o Natal Solidário</p>
          <p className="text-[12px] text-stone-500">
            {plataforma === "ios-outro-navegador"
              ? "Abra este endereço no Safari para poder instalar."
              : "Acompanhe suas cartinhas direto da tela inicial."}
          </p>
        </div>
        <button
          type="button"
          onClick={dispensarBanner}
          aria-label="Dispensar aviso de instalação"
          className="-mr-1 -mt-1 shrink-0 p-1 text-stone-500 hover:text-ink"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {plataforma === "android" && (
        <button type="button" className={CLASSE_BOTAO} onClick={() => void instalar()}>
          Instalar app
        </button>
      )}

      {plataforma === "ios-safari" && (
        <>
          <button type="button" className={CLASSE_BOTAO} onClick={() => setPassosAbertos((aberto) => !aberto)}>
            {passosAbertos ? "Fechar instruções" : "Como instalar"}
          </button>
          {passosAbertos && (
            <ol className="mt-3 flex flex-col gap-2 text-[13px] text-stone-500">
              <li className="flex items-center gap-1.5">
                <span className="font-bold text-ink">1.</span> Toque em
                <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4 text-ink" stroke="currentColor" strokeWidth="1.5" aria-label="Compartilhar">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 12.5V3m0 0L7 6m3-3l3 3M7 9H5.5a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1v-6a1 1 0 0 0-1-1H13" />
                </svg>
                na barra do Safari.
              </li>
              <li className="flex items-center gap-1.5">
                <span className="font-bold text-ink">2.</span> Escolha
                <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4 text-ink" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                  <rect x="3.5" y="3.5" width="13" height="13" rx="2.5" />
                  <path strokeLinecap="round" d="M10 7v6M7 10h6" />
                </svg>
                <strong className="font-bold text-ink">Adicionar à Tela de Início.</strong>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="font-bold text-ink">3.</span> Toque em Adicionar.
              </li>
            </ol>
          )}
        </>
      )}
    </div>
  );
}
