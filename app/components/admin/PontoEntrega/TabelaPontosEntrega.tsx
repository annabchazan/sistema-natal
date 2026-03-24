"use client";

import { excluirPontoEntrega } from "@/app/actions/pontosEntrega";
import { useRouter } from "next/navigation";

export default function TabelaPontosEntrega({
  dados,
  onEdit,
  canManage,
}: {
  dados: any[];
  onEdit: (item: any) => void;
  canManage: boolean;
}) {
  const router = useRouter();
  const handleExcluir = async (id: number) => {
    if (!confirm("Deseja realmente apagar este ponto de entrega?")) {
      return;
    }

    const res = await excluirPontoEntrega(id);
    alert(res.message);
    if (res.success) {
      router.refresh();
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left text-gray-500">
        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
          <tr>
            <th className="px-6 py-3">Nome</th>
            <th className="px-6 py-3">Endereco</th>
            <th className="px-6 py-3">Horario</th>
            <th className="px-6 py-3 text-right">Acoes</th>
          </tr>
        </thead>
        <tbody>
          {dados.map((item) => (
            <tr key={item.id} className="bg-white border-b hover:bg-gray-50">
              <td className="px-6 py-4 font-medium text-gray-900">
                {item.nome_local}
              </td>
              <td className="px-6 py-4">{item.endereco}</td>
              <td className="px-6 py-4">{item.horario}</td>
              <td className="px-6 py-4 text-right space-x-2">
                <button
                  onClick={() => onEdit(item)}
                  className="text-blue-600 hover:underline"
                >
                  Editar
                </button>
                {canManage && (
                  <button
                    onClick={() => handleExcluir(item.id)}
                    className="text-red-600 hover:underline"
                  >
                    Excluir
                  </button>
                )}
              </td>
            </tr>
          ))}
          {dados.length === 0 && (
            <tr>
              <td colSpan={4} className="px-6 py-8 text-center text-gray-400">
                Nenhum ponto de entrega encontrado no banco de dados.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
