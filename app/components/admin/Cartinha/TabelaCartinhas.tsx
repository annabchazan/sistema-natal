"use client";

import { excluirCartinha } from "@/app/actions/cartinhas";

const STATUS_CONFIG: Record<string, { label: string; classes: string }> = {
  disponivel:    { label: "Disponível",    classes: "bg-green-100 text-green-700" },
  apadrinhada:   { label: "Apadrinhada",   classes: "bg-blue-100 text-blue-700" },
  conferida:     { label: "Conferida",     classes: "bg-purple-100 text-purple-700" },
  carente:       { label: "Carente",       classes: "bg-amber-100 text-amber-700" },
  embrulhado:    { label: "Embrulhado",    classes: "bg-indigo-100 text-indigo-700" },
  reapadrinhado: { label: "Reapadrinhado", classes: "bg-yellow-100 text-yellow-700" },
  entregue:      { label: "Entregue",      classes: "bg-emerald-100 text-emerald-700" },
  cancelada:     { label: "Cancelada",     classes: "bg-red-100 text-red-700" },
};

export default function TabelaCartinhas({
  dados,
  onEdit,
  canManage,
}: {
  dados: any[];
  onEdit: (cartinha: any) => void;
  canManage: boolean;
}) {
  const handleExcluir = async (id: number) => {
    if (confirm("Deseja realmente apagar esta cartinha?")) {
      const res = await excluirCartinha(id);
      alert(res.message);
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left text-gray-500">
        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
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
          {dados.map((item) => {
            const statusInfo = STATUS_CONFIG[item.status] ?? {
              label: item.status,
              classes: "bg-gray-100 text-gray-700",
            };
            const hoje = new Date();
            hoje.setHours(0, 0, 0, 0);
            const prazoVencido =
              item.data_limite_entrega &&
              new Date(item.data_limite_entrega) < hoje &&
              item.status !== "entregue" &&
              item.status !== "cancelada";

            return (
              <tr key={item.id} className="bg-white border-b hover:bg-gray-50">
                <td className="px-4 py-4 text-gray-400 text-xs">
                  {item.numero_sequencial ?? item.id}
                </td>
                <td className="px-6 py-4 font-medium text-gray-900">
                  {item.nome_crianca}
                  <span className="text-gray-400 font-normal"> ({item.idade} anos)</span>
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
                    <span className={prazoVencido ? "text-red-600 font-semibold" : "text-gray-600"}>
                      {new Date(item.data_limite_entrega).toLocaleDateString("pt-BR")}
                      {prazoVencido && " ⚠️"}
                    </span>
                  ) : (
                    <span className="text-gray-300">—</span>
                  )}
                </td>
                <td className="p-4 text-right space-x-2">
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
            );
          })}

          {dados.length === 0 && (
            <tr>
              <td colSpan={7} className="px-6 py-8 text-center text-gray-400">
                Nenhuma cartinha encontrada.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
