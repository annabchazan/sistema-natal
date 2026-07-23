"use client";

import { excluirTag } from "@/app/actions/tags";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const handleExcluir = async (id: number) => {
    if (!confirm("Deseja realmente apagar esta tag?")) {
      return;
    }

    const res = await excluirTag(id);
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
            <th className="px-6 py-3 text-right">Ações</th>
          </tr>
        </thead>
        <tbody>
          {dados.map((item) => (
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
                Nenhuma tag encontrada no banco de dados.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
