"use client";
import { cadastrarPontoEntrega } from "@/app/actions/pontosEntrega";
import { useActionState } from "react";

export default function FormularioPontoEntrega() {
  const [state, formAction] = useActionState(cadastrarPontoEntrega, null);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        🏢 Cadastro de Ponto de Entrega
      </h1>

      <form action={formAction} className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Nome do Ponto de Entrega
          </label>
          <input
            name="nome_local"
            type="text"
            required
            placeholder="Ex: Recreação"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none transition"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Horario
            </label>
            <input
              name="horario"
              type="text"
              required
              className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Endereço
            </label>
            <input
              name="endereco"
              type="text"
              required
              placeholder="Ex: Rua das Flores, 123"
              className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
        </div>
        <button
          type="submit"
          className="w-full bg-red-600 text-white font-bold py-3 rounded-lg hover:bg-red-700 transition-all shadow-md active:scale-95"
        >
          Salvar ponto de Entrega
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
  );
}
