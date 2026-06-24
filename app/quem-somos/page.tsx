export default function QuemSomos() {
  return (
    <div className="min-h-screen bg-linear-to-b from-orange-50 to-amber-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-center text-brand mb-8">
            Quem Somos
          </h1>

          <div className="bg-white rounded-[25px] shadow-lg p-8">
            <div className="prose prose-lg max-w-none">
              <p className="text-gray-700 mb-6">
                O <strong>Noelzinho Solidário</strong> é uma iniciativa do{" "}
                <strong>Projeto Sempre Criança</strong>, ONG de Niterói - RJ
                dedicada a conectar padrinhos a crianças de instituições
                parceiras através do apadrinhamento de cartinhas de Natal.
              </p>

              <h2 className="text-2xl font-bold text-brand mb-4">
                Nossa História
              </h2>
              <p className="text-gray-700 mb-6">
                O Projeto Sempre Criança atua há anos em Niterói e São Gonçalo,
                levando alegria e dignidade a crianças em situação de
                vulnerabilidade. O Noelzinho Solidário nasceu para ampliar esse
                impacto durante a temporada natalina, conectando a generosidade
                de padrinhos ao sonho de cada criança.
              </p>

              <h2 className="text-2xl font-bold text-brand mb-4">
                Nossa Missão
              </h2>
              <p className="text-gray-700 mb-6">
                Garantir que nenhuma criança passe o Natal sem receber um
                presente. Acreditamos que cada cartinha representa uma
                oportunidade real de transformar a experiência de uma criança e
                criar memórias inesquecíveis.
              </p>

              <h2 className="text-2xl font-bold text-brand mb-4">
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

              <h2 className="text-2xl font-bold text-brand mb-4">
                Entre em Contato
              </h2>
              <p className="text-gray-700">
                Quer fazer parte dessa corrente de solidariedade? Fale conosco
                pelo e-mail{" "}
                <a
                  href="mailto:contato@semprecrianca.com.br"
                  className="text-brand hover:underline"
                >
                  contato@semprecrianca.com.br
                </a>{" "}
                ou visite nosso site em{" "}
                <a
                  href="https://www.semprecrianca.com.br"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand hover:underline"
                >
                  semprecrianca.com.br
                </a>
                .
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
