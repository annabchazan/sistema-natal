"use client";

import { useState } from "react";
import FormularioTags from "./FormularioTag";
import TabelaTags from "./TabelaTags";

export default function TagsIndex({
  tags,
  canManage,
}: {
  tags: any[];
  canManage: boolean;
}) {
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [tagEmEdicao, setTagEmEdicao] = useState<any | null>(null);

  const abrirEdicao = (tag: any) => {
    setTagEmEdicao(tag);
    setMostrarFormulario(true);
  };

  const fecharFormulario = () => {
    setTagEmEdicao(null);
    setMostrarFormulario(false);
  };

  return (
    <div className="space-y-8">
      {canManage && (
        <div className="flex justify-end">
          <button
            onClick={() => {
              if (mostrarFormulario && !tagEmEdicao) {
                fecharFormulario();
              } else {
                setTagEmEdicao(null);
                setMostrarFormulario(true);
              }
            }}
            className={`px-4 py-2 rounded-lg font-bold transition-all ${
              mostrarFormulario && !tagEmEdicao
                ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
                : "bg-red-600 text-white hover:bg-red-700 shadow-md"
            }`}
          >
            {mostrarFormulario && !tagEmEdicao ? "Cancelar" : "Adicionar tag"}
          </button>
        </div>
      )}

      {mostrarFormulario && (
        <div className="bg-white p-6 rounded-xl border-2 border-red-100 shadow-xl animate-in slide-in-from-top duration-300">
          <FormularioTags
            key={tagEmEdicao?.id ?? "nova"}
            tag={tagEmEdicao}
            onCancel={fecharFormulario}
          />
        </div>
      )}

      <div className="bg-white rounded-lg shadow border border-gray-200">
        <div className="p-4 border-b">
          <h2 className="font-bold text-gray-700">Tags Registradas</h2>
        </div>
        <TabelaTags dados={tags} onEdit={abrirEdicao} canManage={canManage} />
      </div>
    </div>
  );
}
