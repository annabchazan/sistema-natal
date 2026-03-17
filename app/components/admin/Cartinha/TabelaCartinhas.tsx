"use client";
import { excluirCartinha } from "@/app/actions/cartinhas";
export default function TabelaCartinhas({ dados, onEdit }: { dados: any[], onEdit: (cartinha: any) => void }) {
  const handleExcluir = async (id: number) => {
    if (confirm("Deseja realmente apagar esta cartinha?")) {
      const res = await excluirCartinha(id);
      if (res.success) alert(res.message);
    }
  };
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left text-gray-500">
        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
          <tr>
            <th className="px-6 py-3">Criança</th>
            <th className="px-6 py-3">Presente</th>
            <th className="px-6 py-3">Instituição</th>
            <th className="px-6 py-3">Status</th>
            <th className="p-4 text-right">Ações</th>
          </tr>
        </thead>
        <tbody>
          {dados.map((item) => (
            <tr key={item.id} className="bg-white border-b hover:bg-gray-50">
              <td className="px-6 py-4 font-medium text-gray-900">
                {item.nome_crianca} ({item.idade} anos)
              </td>
              <td className="px-6 py-4">{item.presente_pedido}</td>
              <td className="px-6 py-4">{item.nome_instituicao}</td>
              <td className="px-6 py-4">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-bold ${
                    item.status === "disponivel"
                      ? "bg-green-100 text-green-700"
                      : "bg-blue-100 text-blue-700"
                  }`}
                >
                  {item.status}
                </span>
              </td>
              <td className="p-4 text-right space-x-2">
                {/* BOTÃO EDITAR */}
                <button
                  onClick={() => onEdit(item)}
                  className="text-blue-600 hover:underline"
                >
                  Editar
                </button>

                {/* BOTÃO EXCLUIR */}
                <button
                  onClick={() => handleExcluir(item.id)}
                  className="text-red-600 hover:underline"
                >
                  Excluir
                </button>
              </td>
            </tr>
          ))}
          {dados.length === 0 && (
            <tr>
              <td colSpan={4} className="px-6 py-8 text-center text-gray-400">
                Nenhuma cartinha encontrada no banco de dados.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
