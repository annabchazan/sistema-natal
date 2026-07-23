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
        <h2 className="text-lg font-bold text-ink">Crachás</h2>
        <p className="text-sm text-stone-400 mt-1">
          Selecione as cartinhas e gere uma folha pronta para impressão (4 por
          página). Crachás marcados como necessidade especial saem destacados
          — imprimir em papel neon, com a observação no verso.
        </p>
      </div>

      <div className="rounded-md border border-stone-200 p-6 space-y-4">
        <div>
          <label className="block text-[12.5px] font-medium text-stone-600 mb-2">
            Filtrar por instituição
          </label>
          <select
            value={instituicaoId}
            onChange={(e) => setInstituicaoId(e.target.value)}
            className="w-full md:w-80 p-2 border border-stone-300 rounded bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand"
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
          <p className="text-xs text-stone-400">
            {filtradas.length} cartinha{filtradas.length !== 1 ? "s" : ""}
            {totalEspeciais > 0 && ` — ${totalEspeciais} com necessidade especial`}
          </p>
          <div className="flex gap-2 text-xs">
            <button onClick={selecionarTodasFiltradas} className="text-brand-dark hover:underline">
              Selecionar todas (filtradas)
            </button>
            <span className="text-stone-300">|</span>
            <button onClick={limparSelecao} className="text-stone-400 hover:underline">
              Limpar seleção
            </button>
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto divide-y divide-stone-100 border border-stone-200 rounded-md">
          {filtradas.map((c) => {
            const marcado = selecionadas.has(c.id);
            return (
              <label
                key={c.id}
                className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
                  marcado ? "bg-brand/5" : "hover:bg-cream-deep"
                }`}
              >
                <input
                  type="checkbox"
                  checked={marcado}
                  onChange={() => toggleCartinha(c.id)}
                  className="accent-brand h-4 w-4 flex-shrink-0"
                />
                <span className="text-stone-400 text-xs w-10 flex-shrink-0">
                  #{c.numero_sequencial ?? c.id}
                </span>
                <span className="flex-1 text-sm font-medium text-ink">
                  {c.nome_crianca}{" "}
                  <span className="text-stone-400 font-normal">({c.idade} anos)</span>
                </span>
                <span className="text-xs text-stone-500">{c.nome_instituicao}</span>
                {Boolean(c.necessidade_especial) && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-lime-200 text-lime-800">
                    Neon
                  </span>
                )}
              </label>
            );
          })}

          {filtradas.length === 0 && (
            <p className="px-4 py-8 text-center text-stone-400 text-sm">
              Nenhuma cartinha encontrada.
            </p>
          )}
        </div>
      </div>

      <div className="rounded-md border border-dashed border-verde-natal/40 bg-verde-natal/5 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-verde-natal">Pronto para gerar</p>
          <p className="text-xs text-verde-natal/80 mt-0.5">
            {selecionadas.size} cartinha{selecionadas.size !== 1 ? "s" : ""} selecionada
            {selecionadas.size !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={handleGerar}
          disabled={selecionadas.size === 0}
          className="rounded bg-verde-natal px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Gerar folha de crachás
        </button>
      </div>
    </div>
  );
}
