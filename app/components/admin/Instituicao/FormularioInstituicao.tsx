"use client";

import { salvarInstituicao } from "@/app/actions/instituicoes";
import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";

export default function FormularioInstituicao({
  instituicao,
  onCancel,
}: {
  instituicao?: any | null;
  onCancel?: () => void;
}) {
  const router = useRouter();
  const [state, formAction] = useActionState(salvarInstituicao, null);

  useEffect(() => {
    if (state?.success) {
      router.refresh();
      onCancel?.();
    }
  }, [state, router, onCancel]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        {instituicao ? "Editar Instituicao" : "Cadastro de Instituicao"}
      </h1>

      <form action={formAction} className="space-y-5">
        <input type="hidden" name="id" defaultValue={instituicao?.id ?? ""} />

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Nome da Instituicao
          </label>
          <input
            name="nome_instituicao"
            type="text"
            required
            defaultValue={instituicao?.nome_instituicao ?? ""}
            placeholder="Ex: Lar das Criancas"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none transition"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Responsavel
            </label>
            <input
              name="responsavel"
              type="text"
              required
              defaultValue={instituicao?.responsavel ?? ""}
              className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Contato / WhatsApp
            </label>
            <input
              name="contato"
              type="text"
              required
              defaultValue={instituicao?.contato ?? ""}
              placeholder="(22) 99999-9999"
              className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Quantidade de Vagas
          </label>
          <input
            name="quantidade_vagas"
            type="number"
            required
            min="1"
            defaultValue={instituicao?.quantidade_vagas ?? ""}
            placeholder="Ex: 40"
            className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            className="flex-1 bg-red-600 text-white font-bold py-3 rounded-lg hover:bg-red-700 transition-all shadow-md"
          >
            {instituicao ? "Salvar alteracoes" : "Salvar instituicao"}
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
