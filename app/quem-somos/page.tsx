const VALORES = [
  {
    nome: "Respeito",
    texto: "Valorizamos cada criança, cada história e cada pessoa envolvida em nossas ações.",
  },
  {
    nome: "Solidariedade",
    texto: "Acreditamos na força da união para transformar vidas.",
  },
  {
    nome: "Empatia",
    texto: "Buscamos compreender e acolher as necessidades de cada criança.",
  },
  {
    nome: "Responsabilidade",
    texto: "Atuamos com compromisso e transparência em nossas iniciativas.",
  },
  {
    nome: "Compaixão",
    texto: "Promovemos ações guiadas pelo cuidado e pelo amor ao próximo.",
  },
];

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

      <div className="max-w-3xl mx-auto px-4 py-14">
        <h1 className="text-[26px] font-bold text-center text-ink tracking-tight mb-2">
          Quem somos
        </h1>
        <p className="text-center text-stone-500 text-sm mb-10">
          Conheça a história e os valores por trás do Natal Solidário
        </p>

        <div className="bg-white border border-stone-200 border-t-[3px] border-t-brand rounded-md p-7 mb-6">
          <h2 className="text-lg font-bold text-ink mb-3">Natal Solidário</h2>
          <p className="text-[15px] text-stone-600 leading-7 mb-4">
            O Natal Solidário é uma grande festa realizada pelo Sempre
            Criança para cerca de 500 crianças atendidas pelo projeto. Uma
            tarde de sonhos, brincadeiras e momentos especiais, criada
            para levar alegria, afeto e esperança às crianças.
          </p>
          <p className="text-[15px] text-stone-600 leading-7">
            Ao final da celebração, o Papai Noel entrega os presentes
            escolhidos por meio das cartinhas organizadas e apadrinhadas
            pelos voluntários. Os presentes das crianças atendidas por
            instituições parceiras que não participarem da festa serão
            entregues diretamente a essas instituições, garantindo que
            todos recebam seus presentes com muito carinho.
          </p>
        </div>

        <div className="bg-white border border-stone-200 border-t-[3px] border-t-brand rounded-md p-7 mb-6">
          <h2 className="text-lg font-bold text-ink mb-3">Nossa história</h2>
          <p className="text-[15px] text-stone-600 leading-7 mb-4">
            O Sempre Criança é uma associação civil sem fins lucrativos,
            sem vínculo religioso ou partidário, criada em 2002 e
            totalmente realizada por voluntários. O projeto atua em
            Niterói e São Gonçalo, promovendo ações de voluntariado em
            prol de crianças em situação de vulnerabilidade social.
          </p>
          <p className="text-[15px] text-stone-600 leading-7">
            Ao longo de sua trajetória, já beneficiou diretamente mais de
            15 mil crianças e contou com a participação de mais de 8 mil
            voluntários, levando afeto, esperança e valores importantes
            para a infância.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          <div className="bg-white border border-stone-200 rounded-md p-6">
            <h2 className="text-[11px] font-bold text-brand-dark uppercase tracking-wide mb-2">
              Nossa missão
            </h2>
            <p className="text-[14px] text-stone-600 leading-6">
              Promover ações de voluntariado em prol de crianças
              socialmente vulneráveis, contribuindo para o seu
              bem-estar e desenvolvimento.
            </p>
          </div>
          <div className="bg-white border border-stone-200 rounded-md p-6">
            <h2 className="text-[11px] font-bold text-brand-dark uppercase tracking-wide mb-2">
              Nossa visão
            </h2>
            <p className="text-[14px] text-stone-600 leading-6">
              Ser referência no apoio ao voluntariado em favor das
              crianças de Niterói e regiões próximas.
            </p>
          </div>
        </div>

        <div className="bg-white border border-stone-200 rounded-md p-7 mb-6">
          <h2 className="text-lg font-bold text-ink mb-5">Nossos valores</h2>
          <div className="grid sm:grid-cols-2 gap-5">
            {VALORES.map((valor) => (
              <div key={valor.nome} className="flex gap-3">
                <span className="shrink-0 w-8 h-8 rounded-full bg-brand/10 text-brand-dark flex items-center justify-center text-sm">
                  ♥
                </span>
                <div>
                  <p className="font-semibold text-ink text-sm mb-0.5">
                    {valor.nome}
                  </p>
                  <p className="text-[13.5px] text-stone-500 leading-5">
                    {valor.texto}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border-l-[3px] border-brand bg-white rounded-md p-6 text-center">
          <h2 className="text-sm font-bold text-ink mb-2">Entre em contato</h2>
          <p className="text-[13.5px] text-stone-600 mb-5">
            Quer fazer parte dessa corrente de solidariedade? Fale conosco.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href="mailto:contato@semprecrianca.org"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-ink text-white border border-ink px-5 py-2.5 rounded font-semibold text-[13px] hover:bg-white hover:text-ink transition-colors"
            >
              contato@semprecrianca.org
            </a>
            <a
              href="https://www.semprecrianca.org"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-transparent text-ink border border-ink px-5 py-2.5 rounded font-semibold text-[13px] hover:bg-ink hover:text-white transition-colors"
            >
              Visitar semprecrianca.org →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
