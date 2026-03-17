export default function DuvidasFrequentes() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-green-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-center text-red-700 mb-8">
            ❓ Dúvidas Frequentes
          </h1>

          <div className="space-y-6">
            {/* FAQ 1 */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-bold text-red-700 mb-3">
                Como funciona o apadrinhamento de cartinhas?
              </h3>
              <p className="text-gray-700">
                Você escolhe uma cartinha da nossa galeria, adiciona ao carrinho
                e faz a doação dos itens solicitados em um de nossos pontos de
                entrega. Nossa equipe se encarrega de entregar tudo para a
                criança no prazo correto.
              </p>
            </div>

            {/* FAQ 2 */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-bold text-red-700 mb-3">
                Posso apadrinhar mais de uma cartinha?
              </h3>
              <p className="text-gray-700">
                Sim! Você pode apadrinhar quantas cartinhas desejar. Cada
                cartinha representa uma criança diferente e você pode fazer a
                diferença na vida de várias crianças ao mesmo tempo.
              </p>
            </div>

            {/* FAQ 3 */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-bold text-red-700 mb-3">
                Qual é o valor máximo que devo gastar?
              </h3>
              <p className="text-gray-700">
                Cada cartinha tem um valor sugerido máximo. Recomendamos
                respeitar esse limite para que outras pessoas também possam
                participar. Se quiser gastar mais, considere apadrinhar uma
                cartinha adicional.
              </p>
            </div>

            {/* FAQ 4 */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-bold text-red-700 mb-3">
                Como sei se minha doação chegou à criança?
              </h3>
              <p className="text-gray-700">
                Você receberá confirmação por e-mail quando os presentes forem
                entregues à instituição. Além disso, as instituições parceiras
                nos enviam fotos e relatos da entrega para compartilhar com os
                padrinhos.
              </p>
            </div>

            {/* FAQ 5 */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-bold text-red-700 mb-3">
                Posso escolher itens diferentes dos pedidos na cartinha?
              </h3>
              <p className="text-gray-700">
                Preferencialmente, siga os pedidos da cartinha para respeitar os
                desejos da criança. No entanto, se algum item estiver
                indisponível, você pode escolher algo similar de valor
                equivalente. Entre em contato conosco se tiver dúvidas.
              </p>
            </div>

            {/* FAQ 6 */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-bold text-red-700 mb-3">
                Quando devo entregar os presentes?
              </h3>
              <p className="text-gray-700">
                Cada cartinha tem uma data limite de entrega especificada. É
                importante respeitar esse prazo para que as instituições possam
                organizar a distribuição antes do Natal. Verifique sempre as
                datas no momento da escolha.
              </p>
            </div>

            {/* FAQ 7 */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-bold text-red-700 mb-3">
                As instituições são confiáveis?
              </h3>
              <p className="text-gray-700">
                Trabalhamos apenas com instituições parceiras verificadas e com
                histórico de trabalho sério com crianças. Todas as doações
                chegam integralmente às crianças, sem intermediários ou taxas
                administrativas.
              </p>
            </div>

            {/* FAQ 8 */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-bold text-red-700 mb-3">
                Posso visitar a criança ou a instituição?
              </h3>
              <p className="text-gray-700">
                Por questões de privacidade e segurança das crianças, não
                permitimos visitas diretas. No entanto, você pode acompanhar o
                trabalho das instituições através dos relatórios que
                compartilhamos.
              </p>
            </div>

            {/* FAQ 9 */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-bold text-red-700 mb-3">
                E se eu não conseguir cumprir com a doação?
              </h3>
              <p className="text-gray-700">
                Se por algum motivo você não puder cumprir com o apadrinhamento,
                entre em contato conosco o mais breve possível. Podemos realocar
                a cartinha para outra pessoa interessada.
              </p>
            </div>

            {/* FAQ 10 */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-bold text-red-700 mb-3">
                Como entro em contato para tirar dúvidas?
              </h3>
              <p className="text-gray-700">
                Você pode nos contatar através do e-mail
                contato@sistemanatal.com.br ou pelo telefone (11) 9999-9999.
                Estamos disponíveis para ajudar com qualquer dúvida sobre o
                processo de apadrinhamento.
              </p>
            </div>
          </div>

          {/* Ainda tem dúvidas? */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mt-8 text-center">
            <h3 className="text-lg font-bold text-green-800 mb-4">
              Ainda tem dúvidas?
            </h3>
            <p className="text-green-700 mb-4">
              Nossa equipe está pronta para ajudar! Entre em contato conosco.
            </p>
            <div className="space-y-2 text-green-700">
              <p>📧 contato@sistemanatal.com.br</p>
              <p>📞 (11) 9999-9999</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
