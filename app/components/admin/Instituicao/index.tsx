"use client";

import { useState } from "react";
import FormularioInstituicao from "./FormularioInstituicao";
import TabelaInstituicoes from "./TabelaInstituicoes";
import type { InstituicaoItem } from "./types";

interface Props {
  instituicoes: InstituicaoItem[];
  canManage: boolean;
}

export default function InstituicoesIndex({
  instituicoes,
  canManage,
}: Props) {
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [instituicaoEmEdicao, setInstituicaoEmEdicao] = useState<InstituicaoItem | null>(
    null,
  );

  const abrirEdicao = (instituicao: InstituicaoItem) => {
    setInstituicaoEmEdicao(instituicao);
    setMostrarFormulario(true);
  };

  const fecharFormulario = () => {
    setInstituicaoEmEdicao(null);
    setMostrarFormulario(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-md border border-stone-200">
        <div>
          <h2 className="text-lg font-bold text-ink">
            Gerenciar instituições
          </h2>
          <p className="text-sm text-stone-400">
            Total: {instituicoes.length} instituições
          </p>
        </div>

        {canManage && (
          <button
            onClick={() => {
              if (mostrarFormulario && !instituicaoEmEdicao) {
                fecharFormulario();
              } else {
                setInstituicaoEmEdicao(null);
                setMostrarFormulario(true);
              }
            }}
            className={`px-4 py-2 rounded font-bold text-sm transition-colors ${
              mostrarFormulario && !instituicaoEmEdicao
                ? "bg-cream-deep text-stone-500 hover:bg-stone-200"
                : "bg-ink text-white hover:bg-stone-600"
            }`}
          >
            {mostrarFormulario && !instituicaoEmEdicao
              ? "Cancelar"
              : "Adicionar instituição"}
          </button>
        )}
      </div>

      {mostrarFormulario && (
        <div className="bg-white p-6 rounded-md border border-stone-200 animate-in slide-in-from-top duration-300">
          <FormularioInstituicao
            key={instituicaoEmEdicao?.id ?? "nova"}
            instituicao={instituicaoEmEdicao}
            onCancel={fecharFormulario}
          />
        </div>
      )}

      <div className="bg-white rounded-md border border-stone-200 overflow-hidden">
        <TabelaInstituicoes
          dados={instituicoes}
          onEdit={abrirEdicao}
          canManage={canManage}
        />
      </div>
    </div>
  );
}
