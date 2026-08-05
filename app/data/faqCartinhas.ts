export interface FaqItem {
  pergunta: string;
  resposta: string;
}

// Fonte única — usada em /duvidas-frequentes e no widget do WhatsApp, pra não divergir.
export const FAQ_CARTINHAS: FaqItem[] = [
  {
    pergunta: "Como funciona o apadrinhamento de cartinhas?",
    resposta:
      "Escolha uma cartinha, adicione ao carrinho e entregue os itens solicitados em um de nossos pontos de coleta. Os presentes devem ser entregues sem embrulho. Se possível, inclua também papel de presente ou embalagem para presente como doação. Dessa forma, nossa equipe poderá conferir os itens, embrulhá-los e prepará-los com todo o carinho antes da entrega às crianças.",
  },
  {
    pergunta: "Posso apadrinhar mais de uma cartinha?",
    resposta:
      "Sim! É possível apadrinhar até 20 cartinhas por vez. Cada cartinha corresponde a uma criança, então você pode levar alegria e esperança para muitas delas ao mesmo tempo.",
  },
  {
    pergunta: "Como sei se minha doação chegou à criança?",
    resposta:
      "Você receberá uma confirmação por e-mail quando os presentes forem entregues às crianças, seja na Festa de Natal ou por meio das instituições parceiras. Além disso, sempre que possível, compartilharemos fotos e relatos da entrega para que você possa acompanhar esse momento especial.",
  },
  {
    pergunta: "Quando devo entregar os presentes?",
    resposta:
      "Cada cartinha possui uma data limite de entrega. É importante respeitar esse prazo para que nossa equipe e as instituições parceiras tenham tempo de organizar tudo e garantir que os presentes cheguem às crianças no momento certo. Confira sempre a data informada ao escolher a cartinha.",
  },
  {
    pergunta: "E se eu não conseguir cumprir com a doação?",
    resposta:
      "Caso aconteça algum imprevisto e você não consiga realizar a doação, entre em contato conosco o quanto antes. Você também poderá cancelar o apadrinhamento pela sua área de usuário.",
  },
  {
    pergunta: "Como entro em contato para tirar dúvidas?",
    resposta:
      "Você pode entrar em contato conosco pelo e-mail contato@semprecrianca.org ou pelo telefone (21) 99999-9999. Nossa equipe está disponível para ajudar com qualquer dúvida sobre o processo de apadrinhamento.",
  },
];
