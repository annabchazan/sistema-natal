"use client";

export default function TabelaInstituicoes({ dados }: { dados: any[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left text-gray-500">
        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
          <tr>
            <th className="px-6 py-3">Nome</th>
            <th className="px-6 py-3">Responsável</th>
            <th className="px-6 py-3">Contato</th>
          </tr>
        </thead>
        <tbody>
          {dados.map((item) => (
            <tr key={item.id} className="bg-white border-b hover:bg-gray-50">
              <td className="px-6 py-4 font-medium text-gray-900">
                {item.nome_instituicao}
              </td>
              <td className="px-6 py-4">{item.responsavel}</td>
              <td className="px-6 py-4">{item.contato}</td>
            </tr>
          ))}
          {dados.length === 0 && (
            <tr>
              <td colSpan={4} className="px-6 py-8 text-center text-gray-400">
                Nenhuma instituição encontrada no banco de dados.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
