export default function QuemSomos() {
  return (
    <div className="min-h-screen bg-cream">
      {/* Trocar por foto real da instituição: salvar em public/banner-quem-somos.jpg
          e substituir este bloco por <Image src="/banner-quem-somos.jpg" alt="..." fill className="object-cover" /> */}
      <div className="relative h-28 sm:h-36 w-full bg-[repeating-linear-gradient(135deg,#F0EAE0,#F0EAE0_12px,#E7DFD2_12px,#E7DFD2_24px)] flex items-center justify-center">
        <span className="text-xs text-stone-400 font-mono">foto da instituição</span>
      </div>

      <a
        href="https://www.semprecrianca.com.br"
        target="_blank"
        rel="noopener noreferrer"
        className="group flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-4 bg-ink text-white text-center px-4 py-3 hover:bg-stone-600 transition-colors"
      >
        <span className="text-[13px] sm:text-sm">
          Uma iniciativa do <strong>Projeto Sempre Criança</strong> — conheça o trabalho da ONG por trás do Natal Solidário.
        </span>
        <span className="inline-flex items-center gap-1 text-[12.5px] font-bold text-brand whitespace-nowrap group-hover:underline">
          Visitar site →
        </span>
      </a>

      <div className="container mx-auto px-4 py-14">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-[26px] font-bold text-center text-ink tracking-tight mb-8">
            Quem somos
          </h1>

          <div className="bg-white border border-stone-200 rounded-md p-8">
            <div className="max-w-none text-[15px] text-stone-600 leading-7">
              <p className="mb-6">
                O <strong className="text-ink">Natal Solidário</strong> é uma iniciativa do{" "}
                <strong className="text-ink">Projeto Sempre Criança</strong>, ONG de Niterói - RJ
                dedicada a conectar padrinhos a crianças de instituições
                parceiras através do apadrinhamento de cartinhas de Natal.
              </p>

              <h2 className="text-lg font-bold text-ink mb-3 mt-8">
                Nossa história
              </h2>
              <p className="mb-6">
                O Projeto Sempre Criança atua há anos em Niterói e São Gonçalo,
                levando alegria e dignidade a crianças em situação de
                vulnerabilidade. O Natal Solidário nasceu para ampliar esse
                impacto durante a temporada natalina, conectando a generosidade
                de padrinhos ao sonho de cada criança.
              </p>

              <h2 className="text-lg font-bold text-ink mb-3 mt-8">
                Nossa missão
              </h2>
              <p className="mb-6">
                Garantir que nenhuma criança passe o Natal sem receber um
                presente. Acreditamos que cada cartinha representa uma
                oportunidade real de transformar a experiência de uma criança e
                criar memórias inesquecíveis.
              </p>

              <h2 className="text-lg font-bold text-ink mb-3 mt-8">
                Nossos valores
              </h2>
              <ul className="list-disc list-inside mb-6 space-y-2">
                <li>
                  <strong className="text-ink">Solidariedade:</strong> Acreditamos no poder da
                  comunidade
                </li>
                <li>
                  <strong className="text-ink">Transparência:</strong> Todas as doações chegam às
                  crianças
                </li>
                <li>
                  <strong className="text-ink">Alegria:</strong> O Natal deve ser uma festa para
                  todos
                </li>
                <li>
                  <strong className="text-ink">Respeito:</strong> Valorizamos cada criança e cada
                  padrinho
                </li>
              </ul>

              <h2 className="text-lg font-bold text-ink mb-3 mt-8">
                Entre em contato
              </h2>
              <p>
                Quer fazer parte dessa corrente de solidariedade? Fale conosco
                pelo e-mail{" "}
                <a
                  href="mailto:contato@semprecrianca.com.br"
                  className="text-brand-dark hover:underline"
                >
                  contato@semprecrianca.com.br
                </a>{" "}
                ou visite nosso site em{" "}
                <a
                  href="https://www.semprecrianca.com.br"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-dark hover:underline"
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
