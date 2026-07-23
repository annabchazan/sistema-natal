"use client";

import { useState } from "react";
import FormularioPontoEntrega from "./FormularioPontoEntrega";
import TabelaPontosEntrega from "./TabelaPontosEntrega";
import type { PontoEntregaItem } from "./types";

export default function PontosEntregaIndex({
  pontosEntrega,
  canManage,
}: {
  pontosEntrega: PontoEntregaItem[];
  canManage: boolean;
}) {
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [pontoEmEdicao, setPontoEmEdicao] = useState<PontoEntregaItem | null>(null);

  const abrirEdicao = (ponto: PontoEntregaItem) => {
    setPontoEmEdicao(ponto);
    setMostrarFormulario(true);
  };

  const fecharFormulario = () => {
    setPontoEmEdicao(null);
    setMostrarFormulario(false);
  };

  return (
    <div className="space-y-8">
      {canManage && (
        <div className="flex justify-end">
          <button
            onClick={() => {
              if (mostrarFormulario && !pontoEmEdicao) {
                fecharFormulario();
              } else {
                setPontoEmEdicao(null);
                setMostrarFormulario(true);
              }
            }}
            className={`px-4 py-2 rounded font-bold text-sm transition-colors ${
              mostrarFormulario && !pontoEmEdicao
                ? "bg-cream-deep text-stone-500 hover:bg-stone-200"
                : "bg-ink text-white hover:bg-stone-600"
            }`}
          >
            {mostrarFormulario && !pontoEmEdicao
              ? "Cancelar"
              : "Adicionar ponto"}
          </button>
        </div>
      )}

      {mostrarFormulario && (
        <div className="bg-white p-6 rounded-md border border-stone-200 animate-in slide-in-from-top duration-300">
          <FormularioPontoEntrega
            key={pontoEmEdicao?.id ?? "novo"}
            ponto={pontoEmEdicao}
            onCancel={fecharFormulario}
          />
        </div>
      )}

      <div className="bg-white rounded-md border border-stone-200">
        <div className="p-4 border-b border-stone-100">
          <h2 className="font-bold text-sm text-ink">
            Pontos de entrega registrados
          </h2>
        </div>
        <TabelaPontosEntrega
          dados={pontosEntrega}
          onEdit={abrirEdicao}
          canManage={canManage}
        />
      </div>
    </div>
  );
}
