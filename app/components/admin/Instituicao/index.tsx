"use client";

import { useState } from "react";
import FormularioInstituicao from "./FormularioInstituicao";
import TabelaInstituicoes from "./TabelaInstituicoes";

interface Props {
  instituicoes: any[];
  tags: any[];
  cartinhas: any[];
}

export default function InstituicoesIndex({ instituicoes }: Props) {
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  return (
    <div className="space-y-6">
      {/* CABEÇALHO DA ABA */}
      <div className="flex justify-between items-center bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-gray-800">
            Gerenciar instituições
          </h2>
          <p className="text-sm text-gray-500">
            Total: {instituicoes.length} instituições
          </p>
        </div>

        <button
          onClick={() => setMostrarFormulario(!mostrarFormulario)}
          className={`px-4 py-2 rounded-lg font-bold transition-all ${
            mostrarFormulario
              ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
              : "bg-red-600 text-white hover:bg-red-700 shadow-md"
          }`}
        >
          {mostrarFormulario ? "✕ Cancelar" : "➕ Adicionar instituição"}
        </button>
      </div>

      {/* ÁREA DO FORMULÁRIO (Só aparece se o botão for clicado) */}
      {mostrarFormulario && (
        <div className="bg-white p-6 rounded-xl border-2 border-red-100 shadow-xl animate-in slide-in-from-top duration-300">
          <h3 className="text-lg font-bold mb-4 text-red-600">Nova Cartinha</h3>
          <FormularioInstituicao
            instituicoes={instituicoes}
            onSuccess={() => setMostrarFormulario(false)} // Opcional: fecha ao salvar
          />
        </div>
      )}

      {/* TABELA (Sempre visível ou oculta TabelaInstituicoes quando o form abre, você decide) */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <TabelaInstituicoes dados={instituicoes} />
      </div>
    </div>
  );
}
