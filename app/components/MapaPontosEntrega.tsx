"use client";

interface PontoEntrega {
  id: number;
  nome_local: string;
  endereco: string;
  horario: string;
}

interface MapaPontosEntregaProps {
  pontos: PontoEntrega[];
}

export default function MapaPontosEntrega({ pontos }: MapaPontosEntregaProps) {
  return (
    <div className="w-full">
      <h2 className="text-2xl font-bold text-center text-red-700 mb-6">
        Pontos de Entrega
      </h2>

      {pontos.length === 0 ? (
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <p className="text-gray-500 text-lg">
            Nenhum ponto de entrega cadastrado no momento.
          </p>
          <p className="text-gray-400 mt-2">
            Em breve novos pontos serao adicionados.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pontos.map((ponto) => (
            <div
              key={ponto.id}
              className="bg-white rounded-lg shadow-md p-4 border-l-4 border-green-500"
            >
              <h3 className="font-bold text-green-700 mb-2">
                {ponto.nome_local}
              </h3>
              <p className="text-sm text-gray-600 mb-1">{ponto.endereco}</p>
              <p className="text-sm text-gray-600">{ponto.horario}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
