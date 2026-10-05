"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ehErroDeVersaoAntiga, recarregarUmaVez } from "@/app/utils/erroDeVersao";

// Tela compartilhada por app/error.tsx (dentro do layout) e app/global-error.tsx (sem layout).
export default function TelaErro({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
    if (ehErroDeVersaoAntiga(error)) recarregarUmaVez();
  }, [error]);

  return (
    <div className="flex items-center justify-center px-4 py-20 md:py-28">
      <div className="w-full max-w-md bg-white border border-stone-200 rounded-md px-6 py-10 md:px-10 text-center">
        <div className="text-[11px] font-bold tracking-[.14em] text-brand-dark uppercase mb-3">
          Ops, algo deu errado
        </div>
        <h1 className="text-2xl font-bold text-ink tracking-tight mb-3">
          Não conseguimos carregar esta página
        </h1>
        <p className="text-[14px] text-stone-500 leading-6 mb-8">
          Pode ter sido uma instabilidade na conexão. Tente de novo; se continuar,
          volte para o início ou fale com a gente pelo WhatsApp.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => retry()}
            className="bg-ink text-white border border-ink px-6 py-2.5 rounded font-semibold text-[13.5px] hover:bg-white hover:text-ink transition-colors"
          >
            Tentar de novo
          </button>
          <Link
            href="/"
            className="bg-transparent text-stone-600 border border-stone-300 px-6 py-2.5 rounded font-semibold text-[13.5px] hover:bg-cream-deep transition-colors"
          >
            Voltar para o início
          </Link>
        </div>

        {error.digest && (
          <p className="mt-8 text-[11.5px] text-stone-400">
            Código do erro: <span className="font-mono">{error.digest}</span>
          </p>
        )}
      </div>
    </div>
  );
}
