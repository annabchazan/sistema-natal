"use client";

import { useMemo, useState } from "react";
import { excluirCartinha } from "@/app/actions/cartinhas";
import { STATUS_CARTINHA } from "@/lib/statusCartinha";
import { usePaginacao } from "@/app/hooks/usePaginacao";
import { useExclusaoComConfirmacao } from "@/app/hooks/useExclusaoComConfirmacao";
import Paginacao from "@/app/components/admin/Paginacao";
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
  const [filtroStatus, setFiltroStatus] = useState("");
  const [filtroInstituicao, setFiltroInstituicao] = useState("");
  const [filtroCrachaNeon, setFiltroCrachaNeon] = useState("");

  const instituicoesDisponiveis = useMemo(() => {
    const mapa = new Map<number, string>();
    dados.forEach((item) => {
      if (item.nome_instituicao) mapa.set(item.instituicao_id, item.nome_instituicao);
    });
    return Array.from(mapa.entries())
      .map(([id, nome]) => ({ id, nome }))
      .sort((a, b) => a.nome.localeCompare(b.nome));
  }, [dados]);

  const dadosFiltrados = useMemo(() => {
    return dados.filter((item) => {
      if (filtroStatus && item.status !== filtroStatus) return false;
      if (filtroInstituicao && String(item.instituicao_id) !== filtroInstituicao) return false;
      if (filtroCrachaNeon === "sim" && !item.necessidade_especial) return false;
      if (filtroCrachaNeon === "nao" && item.necessidade_especial) return false;
      return true;
    });
  }, [dados, filtroStatus, filtroInstituicao, filtroCrachaNeon]);

  const { paginaAtual, setPaginaAtual, totalPaginas, dadosPaginados } = usePaginacao(dadosFiltrados);
  const handleExcluir = useExclusaoComConfirmacao(
    excluirCartinha,
    "Deseja realmente apagar esta cartinha?",
  );

  const temFiltroAtivo = Boolean(filtroStatus || filtroInstituicao || filtroCrachaNeon);
  const limparFiltros = () => {
    setFiltroStatus("");
    setFiltroInstituicao("");
    setFiltroCrachaNeon("");
    setPaginaAtual(1);
  };

  return (
    <div className="overflow-x-auto">
      <div className="flex flex-wrap items-end gap-4 p-4 border-b border-stone-100 bg-cream/40">
        <div className="min-w-40">
          <label className="block text-[11px] font-semibold text-stone-400 uppercase tracking-wide mb-1">
            Status
          </label>
          <div className="relative">
            <select
              value={filtroStatus}
              onChange={(e) => {
                setFiltroStatus(e.target.value);
                setPaginaAtual(1);
              }}
              className="w-full appearance-none border border-stone-300 rounded pl-2 pr-8 py-1.5 text-sm text-ink bg-white focus:outline-none focus:border-ink"
            >
              <option value="">Todos os status</option>
              {Object.entries(STATUS_CONFIG).map(([key, { label }]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
            <SetaSelect />
          </div>
        </div>

        <div className="min-w-45">
          <label className="block text-[11px] font-semibold text-stone-400 uppercase tracking-wide mb-1">
            Instituição
          </label>
          <div className="relative">
            <select
              value={filtroInstituicao}
              onChange={(e) => {
                setFiltroInstituicao(e.target.value);
                setPaginaAtual(1);
              }}
              className="w-full appearance-none border border-stone-300 rounded pl-2 pr-8 py-1.5 text-sm text-ink bg-white focus:outline-none focus:border-ink"
            >
              <option value="">Todas as instituições</option>
              {instituicoesDisponiveis.map((inst) => (
                <option key={inst.id} value={inst.id}>
                  {inst.nome}
                </option>
              ))}
            </select>
            <SetaSelect />
          </div>
        </div>

        <div className="min-w-40">
          <label className="block text-[11px] font-semibold text-stone-400 uppercase tracking-wide mb-1">
            Crachá neon
          </label>
          <div className="relative">
            <select
              value={filtroCrachaNeon}
              onChange={(e) => {
                setFiltroCrachaNeon(e.target.value);
                setPaginaAtual(1);
              }}
              className="w-full appearance-none border border-stone-300 rounded pl-2 pr-8 py-1.5 text-sm text-ink bg-white focus:outline-none focus:border-ink"
            >
              <option value="">Todas</option>
              <option value="sim">Só com crachá neon</option>
              <option value="nao">Só sem crachá neon</option>
            </select>
            <SetaSelect />
          </div>
        </div>

        {temFiltroAtivo && (
          <button
            onClick={limparFiltros}
            className="text-sm text-stone-500 hover:text-ink hover:underline"
          >
            Limpar filtros
          </button>
        )}

        <div className="ml-auto text-xs text-stone-400 self-center">
          {dadosFiltrados.length} {dadosFiltrados.length === 1 ? "cartinha" : "cartinhas"}
        </div>
      </div>

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

          {dadosFiltrados.length === 0 && (
            <tr>
              <td colSpan={7} className="px-6 py-8 text-center text-stone-400">
                Nenhuma cartinha encontrada.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <Paginacao
        paginaAtual={paginaAtual}
        totalPaginas={totalPaginas}
        totalRegistros={dadosFiltrados.length}
        onChange={setPaginaAtual}
      />
    </div>
  );
}

function SetaSelect() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="m5.5 8 4.5 4.5L14.5 8" />
    </svg>
  );
}
