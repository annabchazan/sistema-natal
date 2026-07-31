"use client";

import { useRouter } from "next/navigation";
import { useToast } from "@/app/components/Toast";

interface ResultadoExclusao {
  success: boolean;
  message: string;
}

export function useExclusaoComConfirmacao<T>(
  excluir: (id: T) => Promise<ResultadoExclusao>,
  mensagemConfirmacao: string,
) {
  const router = useRouter();
  const { mostrarToast } = useToast();

  return async (id: T) => {
    if (!confirm(mensagemConfirmacao)) return;

    const resultado = await excluir(id);
    mostrarToast(resultado.message, resultado.success ? "sucesso" : "erro");
    if (resultado.success) {
      router.refresh();
    }
  };
}
