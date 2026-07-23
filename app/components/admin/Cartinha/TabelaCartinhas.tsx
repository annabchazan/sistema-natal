"use client";

import { useState } from "react";
import { excluirCartinha } from "@/app/actions/cartinhas";
import { STATUS_CARTINHA } from "@/lib/statusCartinha";
import type { CartinhaItem } from "./types";

const STATUS_CONFIG = Object.fromEntries(
  Object.entries(STATUS_CARTINHA).map(([key, { label, badge }]) => [
    key,
    { label, classes: badge },
  ]),
) as Record<string, { label: string; classes: string }>;

export default function TabelaCartinhas({
  dados,
  onEdit,
  canManage,
}: {
  dados: CartinhaItem[];
  onEdit: (cartinha: CartinhaItem) => void;
  canManage: boolean;
}) {
  const ITENS_POR_PAGINA = 20;
  const [paginaAtual, setPaginaAtual] = useState(1);
  const totalPaginas = Math.ceil(dados.length / ITENS_POR_PAGINA);
  const dadosPaginados = dados.slice((paginaAtual - 1) * ITENS_POR_PAGINA, paginaAtual * ITENS_POR_PAGINA);

  const handleExcluir = async (id: number) => {
    if (confirm("Deseja realmente apagar esta cartinha?")) {
      const res = await excluirCartinha(id);
      alert(res.message);
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left text-stone-500">
        <thead className="text-xs text-stone-500 uppercase bg-cream-deep">
          <tr>
            <th className="px-4 py-3">#</th>
            <th className="px-6 py-3">Criança</th>
            <th className="px-6 py-3">Presente</th>
            <th className="px-6 py-3">Instituição</th>
            <th className="px-6 py-3">Status</th>
            <th className="px-6 py-3">Prazo</th>
            <th className="p-4 text-right">Ações</th>
          </tr>
        </thead>
        <tbody>
          {dadosPaginados.map((item) => {
            const statusInfo = STATUS_CONFIG[item.status] ?? {
              label: item.status,
              classes: "bg-stone-100 text-stone-600",
            };
            const hoje = new Date();
            hoje.setHours(0, 0, 0, 0);
            const prazoVencido =
              item.data_limite_entrega &&
              new Date(item.data_limite_entrega) < hoje &&
              item.status !== "entregue" &&
              item.status !== "cancelada";

            return (
              <tr key={item.id} className="bg-white border-b border-stone-100 hover:bg-cream-deep">
                <td className="px-4 py-4 text-stone-400 text-xs">
                  {item.numero_sequencial ?? item.id}
                </td>
                <td className="px-6 py-4 font-medium text-ink">
                  {item.nome_crianca}
                  <span className="text-stone-400 font-normal"> ({item.idade} anos)</span>
                  {Boolean(item.necessidade_especial) && (
                    <span
                      title={item.observacao_especial || "Necessidade especial"}
                      className="ml-2 px-2 py-0.5 rounded-full text-xs font-bold bg-lime-200 text-lime-800"
                    >
                      Crachá neon
                    </span>
                  )}
                </td>
                <td className="px-6 py-4">{item.presente_pedido}</td>
                <td className="px-6 py-4">{item.nome_instituicao}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${statusInfo.classes}`}>
                    {statusInfo.label}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {item.data_limite_entrega ? (
                    <span className={prazoVencido ? "text-vermelho-natal font-semibold" : "text-stone-500"}>
                      {new Date(item.data_limite_entrega).toLocaleDateString("pt-BR")}
                      {prazoVencido && " (!)"}
                    </span>
                  ) : (
                    <span className="text-stone-300">—</span>
                  )}
                </td>
                <td className="p-4 text-right space-x-3">
                  <button
                    onClick={() => onEdit(item)}
                    className="text-brand-dark hover:underline"
                  >
                    Editar
                  </button>
                  {canManage && (
                    <button
                      onClick={() => handleExcluir(item.id)}
                      className="text-vermelho-natal hover:underline"
                    >
                      Excluir
                    </button>
                  )}
                </td>
              </tr>
            );
          })}

          {dados.length === 0 && (
            <tr>
              <td colSpan={7} className="px-6 py-8 text-center text-stone-400">
                Nenhuma cartinha encontrada.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      {totalPaginas > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-stone-100 text-sm text-stone-500">
          <span>{dados.length} registros — Página {paginaAtual} de {totalPaginas}</span>
          <div className="flex gap-2">
            <button
              onClick={() => setPaginaAtual((p) => Math.max(1, p - 1))}
              disabled={paginaAtual === 1}
              className="px-4 py-1.5 rounded border border-stone-300 hover:bg-cream-deep disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Anterior
            </button>
            <button
              onClick={() => setPaginaAtual((p) => Math.min(totalPaginas, p + 1))}
              disabled={paginaAtual === totalPaginas}
              className="px-4 py-1.5 rounded border border-stone-300 hover:bg-cream-deep disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Próxima
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
