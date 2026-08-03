"use client";

import { excluirPontoEntrega } from "@/app/actions/pontosEntrega";
import { usePaginacao } from "@/app/hooks/usePaginacao";
import { useExclusaoComConfirmacao } from "@/app/hooks/useExclusaoComConfirmacao";
import Paginacao from "@/app/components/admin/Paginacao";
import type { PontoEntregaItem } from "./types";

export default function TabelaPontosEntrega({
  dados,
  onEdit,
  canManage,
}: {
  dados: PontoEntregaItem[];
  onEdit: (item: PontoEntregaItem) => void;
  canManage: boolean;
}) {
  const { paginaAtual, setPaginaAtual, totalPaginas, dadosPaginados } = usePaginacao(dados);
  const handleExcluir = useExclusaoComConfirmacao(
    excluirPontoEntrega,
    "Deseja realmente apagar este ponto de entrega?",
  );

  return (
    <div className="overflow-x-auto">
      <table className="hidden md:table w-full text-sm text-left text-stone-500">
        <thead className="text-xs text-stone-500 uppercase bg-cream-deep">
          <tr>
            <th className="px-6 py-3">Nome</th>
            <th className="px-6 py-3">Endereço</th>
            <th className="px-6 py-3">Horário</th>
            <th className="px-6 py-3 text-right">Ações</th>
          </tr>
        </thead>
        <tbody>
          {dadosPaginados.map((item) => (
            <tr key={item.id} className="bg-white border-b border-stone-100 hover:bg-cream-deep">
              <td className="px-6 py-4 font-medium text-ink">
                {item.nome_local}
              </td>
              <td className="px-6 py-4">{item.endereco}</td>
              <td className="px-6 py-4">{item.horario}</td>
              <td className="px-6 py-4 text-right space-x-3">
                <button
                  onClick={() => onEdit(item)}
                  className="text-brand-dark hover:underline p-1.5"
                >
                  Editar
                </button>
                {canManage && (
                  <button
                    onClick={() => handleExcluir(item.id)}
                    className="text-vermelho-natal hover:underline p-1.5"
                  >
                    Excluir
                  </button>
                )}
              </td>
            </tr>
          ))}
          {dados.length === 0 && (
            <tr>
              <td colSpan={4} className="px-6 py-8 text-center text-stone-500">
                Nenhum ponto de entrega encontrado no banco de dados.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="md:hidden divide-y divide-stone-100">
        {dadosPaginados.map((item) => (
          <div key={item.id} className="p-4 space-y-2">
            <p className="font-medium text-ink">{item.nome_local}</p>
            <p className="text-sm text-stone-600">
              <span className="text-stone-500">Endereço:</span> {item.endereco}
            </p>
            <p className="text-sm text-stone-600">
              <span className="text-stone-500">Horário:</span> {item.horario}
            </p>
            <div className="flex gap-2 pt-1 -ml-1.5">
              <button
                onClick={() => onEdit(item)}
                className="text-brand-dark hover:underline p-1.5 text-sm"
              >
                Editar
              </button>
              {canManage && (
                <button
                  onClick={() => handleExcluir(item.id)}
                  className="text-vermelho-natal hover:underline p-1.5 text-sm"
                >
                  Excluir
                </button>
              )}
            </div>
          </div>
        ))}
        {dados.length === 0 && (
          <p className="px-6 py-8 text-center text-stone-500 text-sm">
            Nenhum ponto de entrega encontrado no banco de dados.
          </p>
        )}
      </div>

      <Paginacao
        paginaAtual={paginaAtual}
        totalPaginas={totalPaginas}
        totalRegistros={dados.length}
        onChange={setPaginaAtual}
      />
    </div>
  );
}
