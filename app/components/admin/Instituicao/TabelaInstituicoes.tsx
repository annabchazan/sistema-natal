"use client";

import { excluirInstituicao } from "@/app/actions/instituicoes";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const handleExcluir = async (id: number) => {
    if (!confirm("Deseja realmente apagar esta instituicao?")) {
      return;
    }

    const res = await excluirInstituicao(id);
    alert(res.message);
    if (res.success) {
      router.refresh();
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left text-stone-500">
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
          {dados.map((item) => (
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
              <td colSpan={5} className="px-6 py-8 text-center text-stone-400">
                Nenhuma instituição encontrada no banco de dados.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
