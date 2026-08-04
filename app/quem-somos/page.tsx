export default function QuemSomos() {
  return (
    <div className="min-h-screen bg-cream">
      {/* Trocar por foto real da instituição: salvar em public/banner-quem-somos.jpg
          e substituir este bloco por <Image src="/banner-quem-somos.jpg" alt="..." fill className="object-cover" /> */}
      <div className="relative h-28 sm:h-36 w-full bg-[repeating-linear-gradient(135deg,#F0EAE0,#F0EAE0_12px,#E7DFD2_12px,#E7DFD2_24px)] flex items-center justify-center">
        <span className="text-xs text-stone-500 font-mono">foto da instituição</span>
      </div>

      <a
        href="https://www.semprecrianca.org"
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
              <h2 className="text-lg font-bold text-ink mb-3">
                Natal Solidário
              </h2>
              <p className="mb-6">
                O Natal Solidário é uma grande festa realizada pelo Sempre
                Criança para cerca de 500 crianças atendidas pelo projeto. Uma
                tarde de sonhos, brincadeiras e momentos especiais, criada
                para levar alegria, afeto e esperança às crianças.
              </p>
              <p className="mb-6">
                Ao final da celebração, o Papai Noel entrega os presentes
                escolhidos por meio das cartinhas organizadas e apadrinhadas
                pelos voluntários. Os presentes das crianças atendidas por
                instituições parceiras que não participarem da festa serão
                entregues diretamente a essas instituições, garantindo que
                todos recebam seus presentes com muito carinho.
              </p>

              <h2 className="text-lg font-bold text-ink mb-3 mt-8">
                Nossa história
              </h2>
              <p className="mb-6">
                O Sempre Criança é uma associação civil sem fins lucrativos,
                sem vínculo religioso ou partidário, criada em 2002 e
                totalmente realizada por voluntários. O projeto atua em
                Niterói e São Gonçalo, promovendo ações de voluntariado em
                prol de crianças em situação de vulnerabilidade social.
              </p>
              <p className="mb-6">
                Ao longo de sua trajetória, já beneficiou diretamente mais de
                15 mil crianças e contou com a participação de mais de 8 mil
                voluntários, levando afeto, esperança e valores importantes
                para a infância.
              </p>

              <h2 className="text-lg font-bold text-ink mb-3 mt-8">
                Nossa missão
              </h2>
              <p className="mb-6">
                Promover ações de voluntariado em prol de crianças socialmente
                vulneráveis, contribuindo para o seu bem-estar e
                desenvolvimento.
              </p>

              <h2 className="text-lg font-bold text-ink mb-3 mt-8">
                Nossa visão
              </h2>
              <p className="mb-6">
                Ser referência no apoio ao voluntariado em favor das crianças
                de Niterói e regiões próximas.
              </p>

              <h2 className="text-lg font-bold text-ink mb-3 mt-8">
                Nossos valores
              </h2>
              <ul className="list-disc list-inside mb-6 space-y-2">
                <li>
                  <strong className="text-ink">Respeito:</strong> valorizamos
                  cada criança, cada história e cada pessoa envolvida em
                  nossas ações
                </li>
                <li>
                  <strong className="text-ink">Solidariedade:</strong>{" "}
                  acreditamos na força da união para transformar vidas
                </li>
                <li>
                  <strong className="text-ink">Empatia:</strong> buscamos
                  compreender e acolher as necessidades de cada criança
                </li>
                <li>
                  <strong className="text-ink">Responsabilidade:</strong>{" "}
                  atuamos com compromisso e transparência em nossas
                  iniciativas
                </li>
                <li>
                  <strong className="text-ink">Compaixão:</strong> promovemos
                  ações guiadas pelo cuidado e pelo amor ao próximo
                </li>
              </ul>

              <h2 className="text-lg font-bold text-ink mb-3 mt-8">
                Entre em contato
              </h2>
              <p>
                Quer fazer parte dessa corrente de solidariedade? Fale conosco
                pelo e-mail{" "}
                <a
                  href="mailto:contato@semprecrianca.org"
                  className="text-brand-dark underline hover:text-ink"
                >
                  contato@semprecrianca.org
                </a>{" "}
                ou visite nosso site em{" "}
                <a
                  href="https://www.semprecrianca.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-dark underline hover:text-ink"
                >
                  semprecrianca.org
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
