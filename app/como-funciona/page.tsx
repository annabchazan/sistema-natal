export default function ComoFunciona() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-green-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-center text-red-700 mb-8">
            ❓ Como Funciona
          </h1>

          <div className="space-y-8">
            {/* Passo 1 */}
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-red-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
                  1
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-red-700 mb-4">
                    📝 Escolha uma Cartinha
                  </h2>
                  <p className="text-gray-700 mb-4">
                    Navegue pela nossa galeria de cartinhas e escolha aquela que
                    mais tocou seu coração. Cada cartinha representa uma criança
                    esperando por um pouco de magia natalina.
                  </p>
                  <ul className="list-disc list-inside text-gray-600 space-y-1">
                    <li>Veja a foto da criança (quando disponível)</li>
                    <li>
                      Leia os desejos e necessidades expressos na cartinha
                    </li>
                    <li>Considere a idade e os interesses da criança</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Passo 2 */}
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-green-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
                  2
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-red-700 mb-4">
                    🛒 Adicione ao Carrinho
                  </h2>
                  <p className="text-gray-700 mb-4">
                    Após escolher a cartinha, adicione-a ao seu carrinho de
                    apadrinhamento. Você pode apadrinhar quantas cartinhas
                    desejar!
                  </p>
                  <ul className="list-disc list-inside text-gray-600 space-y-1">
                    <li>Carrinho persistente (salvo no navegador)</li>
                    <li>Visualize todas as suas escolhas</li>
                    <li>Modifique quantidades quando necessário</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Passo 3 */}
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
                  3
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-red-700 mb-4">
                    📦 Faça a Doação
                  </h2>
                  <p className="text-gray-700 mb-4">
                    Leve os presentes até um de nossos pontos de entrega. Nossa
                    equipe se encarrega de entregar tudo para as crianças no
                    prazo correto.
                  </p>
                  <ul className="list-disc list-inside text-gray-600 space-y-1">
                    <li>Confira os pontos de entrega disponíveis</li>
                    <li>Respeite os prazos de entrega</li>
                    <li>Embrulhe os presentes com carinho</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Passo 4 */}
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-yellow-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
                  4
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-red-700 mb-4">
                    🎄 Espalhe Alegria
                  </h2>
                  <p className="text-gray-700 mb-4">
                    Sua doação fará a diferença na vida de uma criança. Você
                    receberá confirmação quando os presentes forem entregues!
                  </p>
                  <ul className="list-disc list-inside text-gray-600 space-y-1">
                    <li>Acompanhe o status da sua doação</li>
                    <li>Receba agradecimentos das instituições</li>
                    <li>Faça parte dessa corrente de solidariedade</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Dicas importantes */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mt-8">
            <h3 className="text-lg font-bold text-yellow-800 mb-4">
              💡 Dicas Importantes
            </h3>
            <ul className="space-y-2 text-yellow-800">
              <li>• Verifique sempre os prazos de entrega das cartinhas</li>
              <li>
                • Respeite o valor máximo sugerido para não sobrecarregar outras
                doações
              </li>
              <li>
                • Entre em contato conosco se tiver dúvidas sobre algum pedido
              </li>
              <li>• Todas as doações são destinadas diretamente às crianças</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
