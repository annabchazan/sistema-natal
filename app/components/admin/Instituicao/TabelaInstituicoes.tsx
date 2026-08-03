"use client";

import { excluirInstituicao } from "@/app/actions/instituicoes";
import { usePaginacao } from "@/app/hooks/usePaginacao";
import { useExclusaoComConfirmacao } from "@/app/hooks/useExclusaoComConfirmacao";
import Paginacao from "@/app/components/admin/Paginacao";
import type { InstituicaoItem } from "./types";

export default function TabelaInstituicoes({
  dados,
  onEdit,
  canManage,
}: {
  dados: InstituicaoItem[];
  onEdit: (item: InstituicaoItem) => void;
  canManage: boolean;
}) {
  const { paginaAtual, setPaginaAtual, totalPaginas, dadosPaginados } = usePaginacao(dados);
  const handleExcluir = useExclusaoComConfirmacao(
    excluirInstituicao,
    "Deseja realmente apagar esta instituicao?",
  );

  return (
    <div className="overflow-x-auto">
      <table className="hidden md:table w-full text-sm text-left text-stone-500">
        <thead className="text-xs text-stone-500 uppercase bg-cream-deep">
          <tr>
            <th className="px-6 py-3">Nome</th>
            <th className="px-6 py-3">Responsável</th>
            <th className="px-6 py-3">Contato</th>
            <th className="px-6 py-3">Vagas</th>
            <th className="px-6 py-3 text-right">Ações</th>
          </tr>
        </thead>
        <tbody>
          {dadosPaginados.map((item) => (
            <tr key={item.id} className="bg-white border-b border-stone-100 hover:bg-cream-deep">
              <td className="px-6 py-4 font-medium text-ink">
                {item.nome_instituicao}
              </td>
              <td className="px-6 py-4">{item.responsavel}</td>
              <td className="px-6 py-4">{item.contato}</td>
              <td className="px-6 py-4">{item.quantidade_vagas ?? 0}</td>
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
              <td colSpan={5} className="px-6 py-8 text-center text-stone-500">
                Nenhuma instituição encontrada no banco de dados.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="md:hidden divide-y divide-stone-100">
        {dadosPaginados.map((item) => (
          <div key={item.id} className="p-4 space-y-2">
            <p className="font-medium text-ink">{item.nome_instituicao}</p>
            <p className="text-sm text-stone-600">
              <span className="text-stone-500">Responsável:</span> {item.responsavel}
            </p>
            <p className="text-sm text-stone-600">
              <span className="text-stone-500">Contato:</span> {item.contato}
            </p>
            <p className="text-sm text-stone-600">
              <span className="text-stone-500">Vagas:</span> {item.quantidade_vagas ?? 0}
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
            Nenhuma instituição encontrada no banco de dados.
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
