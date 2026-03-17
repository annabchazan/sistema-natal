"use client";
import { cadastrarTags } from "@/app/actions/tags";
import { useActionState } from "react";

export default function FormularioTags() {
  const [state, formAction] = useActionState(cadastrarTags, null);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          🏢 Cadastro de Tags
        </h1>

        <form action={formAction} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Nome da tag
            </label>
            <input
              name="nome"
              type="text"
              required
              placeholder="Ex: Brinquedo"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none transition"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-red-600 text-white font-bold py-3 rounded-lg hover:bg-red-700 transition-all shadow-md active:scale-95"
          >
            Salvar tag
          </button>
          {state?.message && (
            <p
              className={`mt-4 p-3 rounded ${state.success ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
            >
              {state.message}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
