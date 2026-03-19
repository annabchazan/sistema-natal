import { listarPontosEntrega } from "@/app/actions/pontosEntrega";
import MapaPontosEntrega from "@/app/components/MapaPontosEntrega";

export default async function PontosEntrega() {
  const pontos = await listarPontosEntrega();

  return (
    <div className="min-h-screen bg-linear-to-b from-red-50 to-green-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold text-center text-red-700 mb-8">
            📍 Pontos de Entrega
          </h1>

          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <p className="text-gray-700 text-center mb-6">
              Encontre o ponto de entrega mais próximo de você. Todos os locais
              são parceiros confiáveis e ficam responsáveis por receber suas
              doações e entregá-las às instituições no prazo correto.
            </p>
          </div>

          {/* Mapa */}
          <div className="mb-12">
            <MapaPontosEntrega pontos={pontos} />
          </div>

          {/* Lista detalhada */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-red-700 mb-6 text-center">
              Lista Completa de Pontos
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pontos.map((ponto) => (
                <div
                  key={ponto.id}
                  className="bg-gray-50 rounded-lg p-6 border-l-4 border-green-500 hover:shadow-md transition-shadow"
                >
                  <h3 className="text-lg font-bold text-green-700 mb-2">
                    {ponto.nome_local}
                  </h3>
                  <div className="space-y-2 text-gray-600">
                    <p className="flex items-start">
                      <span className="mr-2">📍</span>
                      <span>{ponto.endereco}</span>
                    </p>
                    <p className="flex items-start">
                      <span className="mr-2">🕒</span>
                      <span>{ponto.horario}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {pontos.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">
                  Nenhum ponto de entrega cadastrado no momento.
                </p>
                <p className="text-gray-400 mt-2">
                  Em breve novos pontos serão adicionados.
                </p>
              </div>
            )}
          </div>

          {/* Informações importantes */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8">
            <h3 className="text-lg font-bold text-blue-800 mb-4">
              💡 Informações Importantes
            </h3>
            <ul className="space-y-2 text-blue-700">
              <li>• Leve identificação ao entregar os presentes</li>
              <li>
                • Os pontos de entrega funcionam apenas nos horários
                especificados
              </li>
              <li>• Prepare os presentes em embalagens festivas</li>
              <li>
                • Anote o número da cartinha para facilitar a identificação
              </li>
              <li>• Em caso de dúvidas, ligue para o ponto de entrega</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
