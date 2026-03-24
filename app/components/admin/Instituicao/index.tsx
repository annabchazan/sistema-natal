"use client";

import { useState } from "react";
import FormularioInstituicao from "./FormularioInstituicao";
import TabelaInstituicoes from "./TabelaInstituicoes";

interface Props {
  instituicoes: any[];
  canManage: boolean;
}

export default function InstituicoesIndex({
  instituicoes,
  canManage,
}: Props) {
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-gray-800">
            Gerenciar instituicoes
          </h2>
          <p className="text-sm text-gray-500">
            Total: {instituicoes.length} instituicoes
          </p>
        </div>

        {canManage && (
          <button
            onClick={() => setMostrarFormulario(!mostrarFormulario)}
            className={`px-4 py-2 rounded-lg font-bold transition-all ${
              mostrarFormulario
                ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
                : "bg-red-600 text-white hover:bg-red-700 shadow-md"
            }`}
          >
            {mostrarFormulario ? "Cancelar" : "Adicionar instituicao"}
          </button>
        )}
      </div>

      {mostrarFormulario && (
        <div className="bg-white p-6 rounded-xl border-2 border-red-100 shadow-xl animate-in slide-in-from-top duration-300">
          <h3 className="text-lg font-bold mb-4 text-red-600">
            Nova instituicao
          </h3>
          <FormularioInstituicao />
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <TabelaInstituicoes dados={instituicoes} />
      </div>
    </div>
  );
}
