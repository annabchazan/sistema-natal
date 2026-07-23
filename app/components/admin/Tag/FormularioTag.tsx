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
      <h1 className="text-lg font-bold text-ink mb-6">
        {tag ? "Editar tag" : "Cadastro de tag"}
      </h1>

      <form action={formAction} className="space-y-5">
        <input type="hidden" name="id" defaultValue={tag?.id ?? ""} />

        <div>
          <label className="block text-[12.5px] font-semibold text-stone-600 mb-1">
            Nome da tag
          </label>
          <input
            name="nome"
            type="text"
            required
            defaultValue={tag?.nome ?? ""}
            placeholder="Ex: Brinquedo"
            className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-brand/40 focus:border-brand outline-none transition"
          />
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            className="flex-1 bg-ink text-white font-bold py-3 rounded hover:bg-stone-600 transition-colors"
          >
            {tag ? "Salvar alterações" : "Salvar tag"}
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
