interface MetricasProps {
  porStatus: Record<string, number>;
  totalPadrinhos: number;
  totalVencidas: number;
}

const STATUS_CONFIG: Record<string, { label: string; cor: string }> = {
  disponivel:    { label: "Disponíveis",    cor: "bg-gray-100 text-gray-700 border-gray-200"     },
  apadrinhada:   { label: "Apadrinhadas",   cor: "bg-blue-50 text-blue-700 border-blue-200"      },
  conferida:     { label: "Conferidas",     cor: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  carente:       { label: "Carentes",       cor: "bg-orange-50 text-orange-700 border-orange-200" },
  embrulhado:    { label: "Embrulhadas",    cor: "bg-purple-50 text-purple-700 border-purple-200" },
  reapadrinhado: { label: "Reapadrinhadas", cor: "bg-cyan-50 text-cyan-700 border-cyan-200"       },
  entregue:      { label: "Entregues",      cor: "bg-green-50 text-green-700 border-green-200"    },
  cancelada:     { label: "Canceladas",     cor: "bg-red-50 text-red-600 border-red-200"          },
};

export default function DashboardMetricas({
  porStatus,
  totalPadrinhos,
  totalVencidas,
}: MetricasProps) {
  const totalCartinhas = Object.values(porStatus).reduce((a, b) => a + b, 0);
  const totalEntregues = porStatus["entregue"] ?? 0;
  const percentualEntregue =
    totalCartinhas > 0 ? Math.round((totalEntregues / totalCartinhas) * 100) : 0;

  const statusOrdenados = Object.entries(STATUS_CONFIG).map(([key, { label, cor }]) => ({
    key,
    label,
    cor,
    total: porStatus[key] ?? 0,
  }));

  return (
    <div className="space-y-4 mb-8">
      {/* Resumo geral */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">
            Total de cartinhas
          </p>
          <p className="text-3xl font-bold text-gray-800">{totalCartinhas}</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">
            Padrinhos cadastrados
          </p>
          <p className="text-3xl font-bold text-gray-800">{totalPadrinhos}</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">
            Entregues
          </p>
          <p className="text-3xl font-bold text-green-600">{totalEntregues}</p>
          <p className="text-xs text-gray-400 mt-1">{percentualEntregue}% do total</p>
        </div>

        <div
          className={`rounded-xl border shadow-sm p-4 ${
            totalVencidas > 0
              ? "bg-red-50 border-red-200"
              : "bg-white border-gray-200"
          }`}
        >
          <p
            className={`text-xs font-semibold uppercase tracking-wide mb-1 ${
              totalVencidas > 0 ? "text-red-500" : "text-gray-400"
            }`}
          >
            Prazo vencido
          </p>
          <p
            className={`text-3xl font-bold ${
              totalVencidas > 0 ? "text-red-600" : "text-gray-800"
            }`}
          >
            {totalVencidas}
          </p>
          {totalVencidas > 0 && (
            <p className="text-xs text-red-400 mt-1">requerem atenção</p>
          )}
        </div>
      </div>

      {/* Barra de progresso geral */}
      {totalCartinhas > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Progresso da campanha
            </p>
            <p className="text-sm font-semibold text-gray-600">
              {totalEntregues} / {totalCartinhas} entregues
            </p>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
            <div
              className="bg-green-500 h-3 rounded-full transition-all"
              style={{ width: `${percentualEntregue}%` }}
            />
          </div>
        </div>
      )}

      {/* Cards por status */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {statusOrdenados.map(({ key, label, cor, total }) => (
          <div
            key={key}
            className={`rounded-lg border px-3 py-3 text-center ${cor}`}
          >
            <p className="text-2xl font-bold">{total}</p>
            <p className="text-xs font-medium mt-0.5 leading-tight">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
