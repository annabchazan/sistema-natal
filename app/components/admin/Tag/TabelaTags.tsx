"use client";

import { excluirTag } from "@/app/actions/tags";
import { usePaginacao } from "@/app/hooks/usePaginacao";
import { useExclusaoComConfirmacao } from "@/app/hooks/useExclusaoComConfirmacao";
import Paginacao from "@/app/components/admin/Paginacao";
import type { TagItem } from "./types";

export default function TabelaTags({
  dados,
  onEdit,
  canManage,
}: {
  dados: TagItem[];
  onEdit: (item: TagItem) => void;
  canManage: boolean;
}) {
  const { paginaAtual, setPaginaAtual, totalPaginas, dadosPaginados } = usePaginacao(dados);
  const handleExcluir = useExclusaoComConfirmacao(
    excluirTag,
    "Deseja realmente apagar esta categoria?",
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left text-stone-500">
        <thead className="text-xs text-stone-500 uppercase bg-cream-deep">
          <tr>
            <th className="px-6 py-3">Nome</th>
            <th className="px-6 py-3 text-right">Ações</th>
          </tr>
        </thead>
        <tbody>
          {dadosPaginados.map((item) => (
            <tr key={item.id} className="bg-white border-b border-stone-100 hover:bg-cream-deep">
              <td className="px-6 py-4 font-medium text-ink">
                {item.nome}
              </td>
              <td className="px-6 py-4 text-right space-x-3">
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
          ))}
          {dados.length === 0 && (
            <tr>
              <td colSpan={2} className="px-6 py-8 text-center text-stone-400">
                Nenhuma categoria encontrada no banco de dados.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <Paginacao
        paginaAtual={paginaAtual}
        totalPaginas={totalPaginas}
        totalRegistros={dados.length}
        onChange={setPaginaAtual}
      />
    </div>
  );
}
