"use client";

import { salvarTag } from "@/app/actions/tags";
import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import type { TagItem } from "./types";

export default function FormularioTags({
  tag,
  onCancel,
}: {
  tag?: TagItem | null;
  onCancel?: () => void;
}) {
  const router = useRouter();
  const [state, formAction] = useActionState(salvarTag, null);

  useEffect(() => {
    if (state?.success) {
      router.refresh();
      onCancel?.();
    }
  }, [state, router, onCancel]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        {tag ? "Editar Tag" : "Cadastro de Tags"}
      </h1>

      <form action={formAction} className="space-y-5">
        <input type="hidden" name="id" defaultValue={tag?.id ?? ""} />

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Nome da tag
          </label>
          <input
            name="nome"
            type="text"
            required
            defaultValue={tag?.nome ?? ""}
            placeholder="Ex: Brinquedo"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none transition"
          />
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            className="flex-1 bg-red-600 text-white font-bold py-3 rounded-lg hover:bg-red-700 transition-all shadow-md"
          >
            {tag ? "Salvar alteracoes" : "Salvar tag"}
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
