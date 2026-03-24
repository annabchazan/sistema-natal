import { listarPontosEntrega } from "@/app/actions/pontosEntrega";
import MapaPontosEntrega from "@/app/components/MapaPontosEntrega";

export default async function PontosEntrega() {
  const pontos = await listarPontosEntrega();

  return (
    <div className="min-h-screen bg-linear-to-b from-red-50 to-green-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold text-center text-red-700 mb-8">
            Pontos de Entrega
          </h1>

          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <p className="text-gray-700 text-center">
              Confira abaixo os pontos de entrega cadastrados. Todos os locais
              sao parceiros confiaveis e ficam responsaveis por receber suas
              doacoes e entrega-las as instituicoes no prazo correto.
            </p>
          </div>

          <div className="mb-12">
            <MapaPontosEntrega pontos={pontos} />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8">
            <h3 className="text-lg font-bold text-blue-800 mb-4">
              Informacoes Importantes
            </h3>
            <ul className="space-y-2 text-blue-700">
              <li>• Leve identificacao ao entregar os presentes</li>
              <li>• Os pontos de entrega funcionam apenas nos horarios especificados</li>
              <li>• Prepare os presentes em embalagens festivas</li>
              <li>• Anote o numero da cartinha para facilitar a identificacao</li>
              <li>• Em caso de duvidas, ligue para o ponto de entrega</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
