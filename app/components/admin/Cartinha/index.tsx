"use client";

import { useRef, useState } from "react";
import FormularioCartinha from "./FormularioCartinha";
import TabelaCartinhas from "./TabelaCartinhas";
import type { CartinhaItem, InstituicaoOption, TagOption } from "./types";

interface Props {
  instituicoes: InstituicaoOption[];
  tags: TagOption[];
  cartinhas: CartinhaItem[];
  canManage: boolean;
}

export default function CartinhasIndex({
  instituicoes,
  tags,
  cartinhas,
  canManage,
}: Props) {
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [cartinhaEmEdicao, setCartinhaEmEdicao] = useState<CartinhaItem | null>(null);
  const formularioRef = useRef<HTMLDivElement>(null);

  const rolarAteFormulario = () => {
    requestAnimationFrame(() => {
      formularioRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const abrirFormularioEdicao = (cartinha: CartinhaItem) => {
    setCartinhaEmEdicao(cartinha);
    setMostrarFormulario(true);
    rolarAteFormulario();
  };

  const fecharFormulario = () => {
    setCartinhaEmEdicao(null);
    setMostrarFormulario(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-md border border-stone-200">
        <div>
          <h2 className="text-lg font-bold text-ink">
            Gerenciar Cartinhas
          </h2>
          <p className="text-sm text-stone-500">
            Total: {cartinhas.length} cartinhas
          </p>
        </div>

        {canManage && (
          <button
            onClick={() => {
              if (mostrarFormulario) {
                fecharFormulario();
              } else {
                setCartinhaEmEdicao(null);
                setMostrarFormulario(true);
                rolarAteFormulario();
              }
            }}
            className={`px-4 py-2 rounded font-bold text-sm transition-colors ${
              mostrarFormulario
                ? "bg-cream-deep text-stone-500 hover:bg-stone-200"
                : "bg-ink text-white hover:bg-stone-600"
            }`}
          >
            {mostrarFormulario ? "Cancelar" : "Adicionar Cartinha"}
          </button>
        )}
      </div>

      {mostrarFormulario && (
        <div
          ref={formularioRef}
          className="bg-white p-6 rounded-md border border-stone-200 animate-in slide-in-from-top duration-300 scroll-mt-4"
        >
          <h3 className="text-base font-bold mb-4 text-ink">
            {cartinhaEmEdicao ? "Editar Cartinha" : "Nova Cartinha"}
          </h3>
          <FormularioCartinha
            instituicoes={instituicoes}
            tags={tags}
            cartinha={cartinhaEmEdicao}
            onSuccess={fecharFormulario}
          />
        </div>
      )}

      <div className="bg-white rounded-md border border-stone-200 overflow-hidden">
        <TabelaCartinhas
          dados={cartinhas}
          onEdit={abrirFormularioEdicao}
          canManage={canManage}
        />
      </div>
    </div>
  );
}
