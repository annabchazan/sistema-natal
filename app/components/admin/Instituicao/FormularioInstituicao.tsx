"use client";
import { cadastrarInstituicao } from "@/app/actions/instituicoes";
import { useActionState } from "react";

export default function FormularioInstituicao() {
  const [state, formAction] = useActionState(cadastrarInstituicao, null);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        🏢 Cadastro de Instituição
      </h1>

      <form action={formAction} className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Nome da Instituição
          </label>
          <input
            name="nome_instituicao"
            type="text"
            required
            placeholder="Ex: Lar das Crianças"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none transition"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Responsável
            </label>
            <input
              name="responsavel"
              type="text"
              required
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
            placeholder="Ex: 40"
            className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-red-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            As cartinhas desta instituição serão numeradas sequencialmente de
            acordo com esta quantidade
          </p>
        </div>
        <button
          type="submit"
          className="w-full bg-red-600 text-white font-bold py-3 rounded-lg hover:bg-red-700 transition-all shadow-md active:scale-95"
        >
          Salvar Instituição
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
