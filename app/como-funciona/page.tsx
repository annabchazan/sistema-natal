const passos = [
  {
    titulo: "Escolha uma cartinha",
    texto:
      "Navegue pela nossa galeria de cartinhas e escolha aquela que mais tocou seu coração. Cada cartinha representa uma criança com um desejo especial para o Natal.",
    itens: [
      "Veja a foto da cartinha (quando disponível)",
      "Leia com atenção os desejos e necessidades expressos pela criança",
      "Considere a idade e os interesses da criança",
      "Procure doar o presente da forma mais próxima possível ao pedido realizado, respeitando a escolha e o sonho de cada criança",
    ],
  },
  {
    titulo: "Adicione ao carrinho",
    texto:
      "Após escolher a cartinha, adicione-a ao seu carrinho de apadrinhamento. Você pode apadrinhar até 20 cartinhas por vez.",
    itens: [
      "Seu carrinho ficará salvo no navegador para facilitar o retorno",
      "Confira suas escolhas antes de finalizar",
    ],
  },
  {
    titulo: "Entregue os presentes",
    texto:
      "Leve os presentes até um de nossos pontos de entrega, identificando-os com o número da cartinha e o nome da criança.",
    itens: [
      "Não entregue o presente embrulhado, para que nossa equipe possa conferir os itens corretamente",
      "Sempre que possível, doe também o papel de presente ou embalagem separadamente, para que o presente seja preparado com carinho",
      "Confira os pontos de entrega disponíveis",
      "Respeite os prazos de entrega informados",
    ],
  },
  {
    titulo: "A magia chega até a criança",
    texto:
      "Depois de receber os presentes, o Sempre Criança organiza tudo com muito cuidado para que cada criança receba o presente escolhido através da sua cartinha. Graças à sua participação, o desejo de uma criança se transforma em um momento inesquecível.",
    itens: [
      "Os presentes são separados e preparados para a entrega",
      "Cada pedido é entregue com carinho e atenção",
      "As entregas são realizadas na Festa de Natal ou por meio das instituições parceiras",
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
                  <div className="shrink-0 w-9 h-9 bg-brand-dark text-white rounded-full flex items-center justify-center text-sm font-bold">
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
                <li>Fique atento aos prazos indicados em cada cartinha para garantir que o presente chegue a tempo</li>
                <li>Cada doação é entregue com carinho e destinada diretamente à criança escolhida</li>
                <li>Em caso de dúvidas sobre o pedido da criança, nossa equipe está à disposição para ajudar</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
