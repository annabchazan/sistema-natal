export interface FaqItem {
  pergunta: string;
  resposta: string;
}

// Fonte única das perguntas frequentes — usada na página /duvidas-frequentes
// e no widget do botão do WhatsApp, pra evitar que as duas fiquem divergentes.
export const FAQ_CARTINHAS: FaqItem[] = [
  {
    pergunta: "Como funciona o apadrinhamento de cartinhas?",
    resposta:
      "Você escolhe uma cartinha da nossa galeria, adiciona ao carrinho e faz a doação dos itens solicitados em um de nossos pontos de entrega. Nossa equipe se encarrega de entregar tudo para a criança no prazo correto.",
  },
  {
    pergunta: "Posso apadrinhar mais de uma cartinha?",
    resposta:
      "Sim! Você pode apadrinhar até 20 cartinhas por vez. Cada cartinha representa uma criança diferente e você pode fazer a diferença na vida de várias crianças ao mesmo tempo.",
  },
  {
    pergunta: "Qual é o valor máximo que devo gastar?",
    resposta:
      "Cada cartinha tem um valor sugerido máximo. Recomendamos respeitar esse limite para que outras pessoas também possam participar. Se quiser gastar mais, considere apadrinhar uma cartinha adicional.",
  },
  {
    pergunta: "Como sei se minha doação chegou à criança?",
    resposta:
      "Você receberá confirmação por e-mail quando os presentes forem entregues à instituição. Além disso, as instituições parceiras nos enviam fotos e relatos da entrega para compartilhar com os padrinhos.",
  },
  {
    pergunta: "Posso escolher itens diferentes dos pedidos na cartinha?",
    resposta:
      "Preferencialmente, siga os pedidos da cartinha para respeitar os desejos da criança. No entanto, se algum item estiver indisponível, você pode escolher algo similar de valor equivalente. Entre em contato conosco se tiver dúvidas.",
  },
  {
    pergunta: "Quando devo entregar os presentes?",
    resposta:
      "Cada cartinha tem uma data limite de entrega especificada. É importante respeitar esse prazo para que as instituições possam organizar a distribuição antes do Natal. Verifique sempre as datas no momento da escolha.",
  },
  {
    pergunta: "As instituições são confiáveis?",
    resposta:
      "Trabalhamos apenas com instituições parceiras verificadas e com histórico de trabalho sério com crianças. Todas as doações chegam integralmente às crianças, sem intermediários ou taxas administrativas.",
  },
  {
    pergunta: "Posso visitar a criança ou a instituição?",
    resposta:
      "Por questões de privacidade e segurança das crianças, não permitimos visitas diretas. No entanto, você pode acompanhar o trabalho das instituições através dos relatórios que compartilhamos.",
  },
  {
    pergunta: "E se eu não conseguir cumprir com a doação?",
    resposta:
      'Se por algum motivo você não puder cumprir com o apadrinhamento, entre em contato conosco o mais breve possível. Você também pode cancelar pela sua área de usuário enquanto o status for "apadrinhada".',
  },
  {
    pergunta: "Como entro em contato para tirar dúvidas?",
    resposta:
      "Você pode nos contatar através do e-mail contato@semprecrianca.com.br ou pelo telefone (21) 99999-9999. Estamos disponíveis para ajudar com qualquer dúvida sobre o processo de apadrinhamento.",
  },
];
