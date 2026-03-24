"use client";

import { useState } from "react";
import FormularioPontoEntrega from "./FormularioPontoEntrega";
import TabelaPontosEntrega from "./TabelaPontosEntrega";

export default function PontosEntregaIndex({
  pontosEntrega,
  canManage,
}: {
  pontosEntrega: any[];
  canManage: boolean;
}) {
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [pontoEmEdicao, setPontoEmEdicao] = useState<any | null>(null);

  const abrirEdicao = (ponto: any) => {
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
            className={`px-4 py-2 rounded-lg font-bold transition-all ${
              mostrarFormulario && !pontoEmEdicao
                ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
                : "bg-red-600 text-white hover:bg-red-700 shadow-md"
            }`}
          >
            {mostrarFormulario && !pontoEmEdicao
              ? "Cancelar"
              : "Adicionar ponto"}
          </button>
        </div>
      )}

      {mostrarFormulario && (
        <div className="bg-white p-6 rounded-xl border-2 border-red-100 shadow-xl animate-in slide-in-from-top duration-300">
          <FormularioPontoEntrega
            key={pontoEmEdicao?.id ?? "novo"}
            ponto={pontoEmEdicao}
            onCancel={fecharFormulario}
          />
        </div>
      )}

      <div className="bg-white rounded-lg shadow border border-gray-200">
        <div className="p-4 border-b">
          <h2 className="font-bold text-gray-700">
            Pontos de Entrega Registrados
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
