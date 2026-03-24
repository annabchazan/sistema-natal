"use client";

import { salvarPontoEntrega } from "@/app/actions/pontosEntrega";
import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";

export default function FormularioPontoEntrega({
  ponto,
  onCancel,
}: {
  ponto?: any | null;
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
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        {ponto ? "Editar Ponto de Entrega" : "Cadastro de Ponto de Entrega"}
      </h1>

      <form action={formAction} className="space-y-5">
        <input type="hidden" name="id" defaultValue={ponto?.id ?? ""} />

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Nome do Ponto de Entrega
          </label>
          <input
            name="nome_local"
            type="text"
            required
            defaultValue={ponto?.nome_local ?? ""}
            placeholder="Ex: Recreacao"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none transition"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Horario
            </label>
            <input
              name="horario"
              type="text"
              required
              defaultValue={ponto?.horario ?? ""}
              className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Endereco
            </label>
            <input
              name="endereco"
              type="text"
              required
              defaultValue={ponto?.endereco ?? ""}
              placeholder="Ex: Rua das Flores, 123"
              className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            className="flex-1 bg-red-600 text-white font-bold py-3 rounded-lg hover:bg-red-700 transition-all shadow-md"
          >
            {ponto ? "Salvar alteracoes" : "Salvar ponto de entrega"}
          </button>

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-3 rounded-lg font-bold bg-gray-100 text-gray-700 hover:bg-gray-200"
            >
              Cancelar
            </button>
          )}
        </div>

        {state?.message && (
          <p
            className={`mt-4 p-3 rounded ${state.success ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
          >
            {state.message}
          </p>
        )}
      </form>
    </div>
  );
}
