"use client";

import { salvarPontoEntrega } from "@/app/actions/pontosEntrega";
import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import type { PontoEntregaItem } from "./types";

export default function FormularioPontoEntrega({
  ponto,
  onCancel,
}: {
  ponto?: PontoEntregaItem | null;
  onCancel?: () => void;
}) {
  const router = useRouter();
  const [state, formAction] = useActionState(salvarPontoEntrega, null);

  useEffect(() => {
    if (state?.success) {
      router.refresh();
      onCancel?.();
    }
  }, [state, router, onCancel]);

  return (
    <div>
      <h1 className="text-lg font-bold text-ink mb-6">
        {ponto ? "Editar ponto de entrega" : "Cadastro de ponto de entrega"}
      </h1>

      <form action={formAction} className="space-y-5">
        <input type="hidden" name="id" defaultValue={ponto?.id ?? ""} />

        <div>
          <label className="block text-[12.5px] font-semibold text-stone-600 mb-1">
            Nome do ponto de entrega
          </label>
          <input
            name="nome_local"
            type="text"
            required
            defaultValue={ponto?.nome_local ?? ""}
            placeholder="Ex: Recreação"
            className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-brand/40 focus:border-brand outline-none transition"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[12.5px] font-semibold text-stone-600 mb-1">
              Horário
            </label>
            <input
              name="horario"
              type="text"
              required
              defaultValue={ponto?.horario ?? ""}
              className="w-full p-3 border border-gray-300 rounded outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand"
            />
          </div>

          <div>
            <label className="block text-[12.5px] font-semibold text-stone-600 mb-1">
              Endereço
            </label>
            <input
              name="endereco"
              type="text"
              required
              defaultValue={ponto?.endereco ?? ""}
              placeholder="Ex: Rua das Flores, 123"
              className="w-full p-3 border border-gray-300 rounded outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            className="flex-1 bg-ink text-white font-bold py-3 rounded hover:bg-stone-600 transition-colors"
          >
            {ponto ? "Salvar alterações" : "Salvar ponto de entrega"}
          </button>

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-3 rounded font-bold text-sm bg-cream-deep text-stone-500 hover:bg-stone-200"
            >
              Cancelar
            </button>
          )}
        </div>

        {state?.message && (
          <p
            className={`mt-4 p-3 rounded text-sm ${state.success ? "bg-verde-natal/10 text-verde-natal" : "bg-vermelho-natal/10 text-vermelho-natal"}`}
          >
            {state.message}
          </p>
        )}
      </form>
    </div>
  );
}
