"use client";

import { useMemo, useState } from "react";
import type { CartinhaParaCracha, InstituicaoOption } from "./types";

export default function CrachasIndex({
  cartinhas,
  instituicoes,
}: {
  cartinhas: CartinhaParaCracha[];
  instituicoes: InstituicaoOption[];
}) {
  const [instituicaoId, setInstituicaoId] = useState<string>("");
  const [selecionadas, setSelecionadas] = useState<Set<number>>(new Set());

  const filtradas = useMemo(
    () =>
      instituicaoId
        ? cartinhas.filter((c) => c.instituicao_id === Number(instituicaoId))
        : cartinhas,
    [cartinhas, instituicaoId],
  );

  function toggleCartinha(id: number) {
    setSelecionadas((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function selecionarTodasFiltradas() {
    setSelecionadas(new Set(filtradas.map((c) => c.id)));
  }

  function limparSelecao() {
    setSelecionadas(new Set());
  }

  function handleGerar() {
    const params = new URLSearchParams({ ids: [...selecionadas].join(",") });
    window.open(`/admin/crachas/imprimir?${params.toString()}`, "_blank");
  }

  const totalEspeciais = filtradas.filter((c) => c.necessidade_especial).length;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-gray-800">Crachás</h2>
        <p className="text-sm text-gray-500 mt-1">
          Selecione as cartinhas e gere uma folha pronta para impressão (4 por
          página). Crachás marcados como necessidade especial saem destacados
          — imprimir em papel neon, com a observação no verso.
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filtrar por instituição
          </label>
          <select
            value={instituicaoId}
            onChange={(e) => setInstituicaoId(e.target.value)}
            className="w-full md:w-80 p-2 border rounded-md bg-white"
          >
            <option value="">Todas as instituições</option>
            {instituicoes.map((inst) => (
              <option key={inst.id} value={inst.id}>
                {inst.nome_instituicao}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-400">
            {filtradas.length} cartinha{filtradas.length !== 1 ? "s" : ""}
            {totalEspeciais > 0 && ` — ${totalEspeciais} com necessidade especial`}
          </p>
          <div className="flex gap-2 text-xs">
            <button onClick={selecionarTodasFiltradas} className="text-blue-600 hover:underline">
              Selecionar todas (filtradas)
            </button>
            <span className="text-gray-300">|</span>
            <button onClick={limparSelecao} className="text-gray-500 hover:underline">
              Limpar seleção
            </button>
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto divide-y divide-gray-100 border rounded-lg">
          {filtradas.map((c) => {
            const marcado = selecionadas.has(c.id);
            return (
              <label
                key={c.id}
                className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
                  marcado ? "bg-red-50" : "hover:bg-gray-50"
                }`}
              >
                <input
                  type="checkbox"
                  checked={marcado}
                  onChange={() => toggleCartinha(c.id)}
                  className="accent-red-600 h-4 w-4 flex-shrink-0"
                />
                <span className="text-gray-400 text-xs w-10 flex-shrink-0">
                  #{c.numero_sequencial ?? c.id}
                </span>
                <span className="flex-1 text-sm font-medium text-gray-800">
                  {c.nome_crianca}{" "}
                  <span className="text-gray-400 font-normal">({c.idade} anos)</span>
                </span>
                <span className="text-xs text-gray-500">{c.nome_instituicao}</span>
                {c.necessidade_especial && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-lime-200 text-lime-800">
                    Neon
                  </span>
                )}
              </label>
            );
          })}

          {filtradas.length === 0 && (
            <p className="px-4 py-8 text-center text-gray-400 text-sm">
              Nenhuma cartinha encontrada.
            </p>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-dashed border-green-300 bg-green-50 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-green-800">Pronto para gerar</p>
          <p className="text-xs text-green-700 mt-0.5">
            {selecionadas.size} cartinha{selecionadas.size !== 1 ? "s" : ""} selecionada
            {selecionadas.size !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={handleGerar}
          disabled={selecionadas.size === 0}
          className="rounded-lg bg-green-600 px-6 py-3 text-sm font-bold text-white shadow transition-colors hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Gerar folha de crachás
        </button>
      </div>
    </div>
  );
}
