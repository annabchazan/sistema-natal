const passos = [
  {
    titulo: "Escolha uma cartinha",
    texto:
      "Navegue pela nossa galeria de cartinhas e escolha aquela que mais tocou seu coração. Cada cartinha representa uma criança esperando por um pouco de magia natalina.",
    itens: [
      "Veja a foto da criança (quando disponível)",
      "Leia os desejos e necessidades expressos na cartinha",
      "Considere a idade e os interesses da criança",
    ],
  },
  {
    titulo: "Adicione ao carrinho",
    texto:
      "Após escolher a cartinha, adicione-a ao seu carrinho de apadrinhamento. Você pode apadrinhar quantas cartinhas desejar!",
    itens: [
      "Carrinho salvo no navegador",
      "Visualize todas as suas escolhas",
      "Modifique quantidades quando necessário",
    ],
  },
  {
    titulo: "Leve os presentes",
    texto:
      "Leve os presentes até um de nossos pontos de entrega. Nossa equipe se encarrega de entregar tudo para as crianças no prazo correto.",
    itens: [
      "Confira os pontos de entrega disponíveis",
      "Respeite os prazos de entrega",
      "Embrulhe os presentes com carinho",
    ],
  },
  {
    titulo: "Espalhe alegria",
    texto:
      "Sua doação fará a diferença na vida de uma criança. Você receberá confirmação quando os presentes forem entregues!",
    itens: [
      "Acompanhe o status da sua doação",
      "Receba agradecimentos das instituições",
      "Faça parte dessa corrente de solidariedade",
    ],
  },
];

export default function ComoFunciona() {
  return (
    <div className="min-h-screen bg-cream py-14">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-[26px] font-bold text-center text-ink tracking-tight mb-8">
            Como funciona
          </h1>

          <div>
            {passos.map((passo, index) => (
              <div key={passo.titulo} className="flex gap-5">
                <div className="flex flex-col items-center">
                  <div className="shrink-0 w-9 h-9 bg-brand text-white rounded-full flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </div>
                  {index < passos.length - 1 && (
                    <div className="w-0.5 flex-1 bg-brand/20 my-1" />
                  )}
                </div>

                <div className="flex-1 min-w-0 mb-4 bg-white border border-stone-200 border-t-[3px] border-t-brand rounded-md p-7 transition-shadow hover:shadow-[0_8px_24px_rgba(30,27,23,.08)]">
                  <h2 className="text-lg font-bold text-ink mb-2.5">
                    {passo.titulo}
                  </h2>
                  <p className="text-[14px] text-stone-600 mb-3 leading-6">
                    {passo.texto}
                  </p>
                  <ul className="list-disc list-inside text-[13.5px] text-stone-500 space-y-1">
                    {passo.itens.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-start gap-3 border-l-[3px] border-brand bg-white rounded-md p-6 mt-2">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="w-5 h-5 mt-0.5 shrink-0 text-brand-dark"
              stroke="currentColor"
              strokeWidth="1.6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18"
              />
            </svg>
            <div>
              <h3 className="text-sm font-bold text-ink mb-3">
                Dicas importantes
              </h3>
              <ul className="space-y-1.5 text-[13.5px] text-stone-600">
                <li>Verifique sempre os prazos de entrega das cartinhas</li>
                <li>Entre em contato conosco se tiver dúvidas sobre algum pedido</li>
                <li>Todas as doações são destinadas diretamente às crianças</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
