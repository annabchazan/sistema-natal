export default function QuemSomos() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-green-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-center text-red-700 mb-8">
            🎄 Quem Somos
          </h1>

          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="prose prose-lg max-w-none">
              <p className="text-gray-700 mb-6">
                O <strong>Sistema Natal</strong> é uma iniciativa dedicada a
                conectar corações e espalhar alegria durante a temporada
                natalina. Nossa missão é fazer com que o espírito do Natal
                chegue a todas as crianças, independentemente de sua situação
                econômica ou social.
              </p>

              <h2 className="text-2xl font-bold text-red-700 mb-4">
                Nossa História
              </h2>
              <p className="text-gray-700 mb-6">
                Fundado em 2020, o Sistema Natal nasceu da vontade de um grupo
                de voluntários que acreditavam que o Natal deveria ser uma festa
                para todos. Começamos com apenas algumas cartinhas e hoje
                ajudamos centenas de crianças todos os anos.
              </p>

              <h2 className="text-2xl font-bold text-red-700 mb-4">
                Nossa Missão
              </h2>
              <p className="text-gray-700 mb-6">
                Conectar pessoas generosas com crianças que precisam de um pouco
                de magia natalina. Acreditamos que cada cartinha representa uma
                oportunidade de transformar vidas e criar memórias
                inesquecíveis.
              </p>

              <h2 className="text-2xl font-bold text-red-700 mb-4">
                Nossos Valores
              </h2>
              <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
                <li>
                  <strong>Solidariedade:</strong> Acreditamos no poder da
                  comunidade
                </li>
                <li>
                  <strong>Transparência:</strong> Todas as doações chegam às
                  crianças
                </li>
                <li>
                  <strong>Alegria:</strong> O Natal deve ser uma festa para
                  todos
                </li>
                <li>
                  <strong>Respeito:</strong> Valorizamos cada criança e cada
                  padrinho
                </li>
              </ul>

              <h2 className="text-2xl font-bold text-red-700 mb-4">
                Entre em Contato
              </h2>
              <p className="text-gray-700">
                Quer fazer parte dessa magia? Entre em contato conosco e
                descubra como você pode ajudar a tornar o Natal mais especial
                para muitas crianças.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
