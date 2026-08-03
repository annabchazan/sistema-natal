"use client";

import { useState } from "react";
import FormularioTags from "./FormularioTag";
import TabelaTags from "./TabelaTags";
import type { TagItem } from "./types";

export default function TagsIndex({
  tags,
  canManage,
}: {
  tags: TagItem[];
  canManage: boolean;
}) {
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [tagEmEdicao, setTagEmEdicao] = useState<TagItem | null>(null);

  const abrirEdicao = (tag: TagItem) => {
    setTagEmEdicao(tag);
    setMostrarFormulario(true);
  };

  const fecharFormulario = () => {
    setTagEmEdicao(null);
    setMostrarFormulario(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-md border border-stone-200">
        <div>
          <h2 className="text-lg font-bold text-ink">Gerenciar categorias</h2>
          <p className="text-sm text-stone-500">Total: {tags.length} categorias</p>
        </div>

        {canManage && (
          <button
            onClick={() => {
              if (mostrarFormulario && !tagEmEdicao) {
                fecharFormulario();
              } else {
                setTagEmEdicao(null);
                setMostrarFormulario(true);
              }
            }}
            className={`px-4 py-2 rounded font-bold text-sm transition-colors ${
              mostrarFormulario && !tagEmEdicao
                ? "bg-cream-deep text-stone-500 hover:bg-stone-200"
                : "bg-ink text-white hover:bg-stone-600"
            }`}
          >
            {mostrarFormulario && !tagEmEdicao ? "Cancelar" : "Adicionar categoria"}
          </button>
        )}
      </div>

      {mostrarFormulario && (
        <div className="bg-white p-6 rounded-md border border-stone-200 animate-in slide-in-from-top duration-300">
          <FormularioTags
            key={tagEmEdicao?.id ?? "nova"}
            tag={tagEmEdicao}
            onCancel={fecharFormulario}
          />
        </div>
      )}

      <div className="bg-white rounded-md border border-stone-200 overflow-hidden">
        <TabelaTags dados={tags} onEdit={abrirEdicao} canManage={canManage} />
      </div>
    </div>
  );
}
