import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidade | Natal Solidário",
  description:
    "Como a Sempre Criança trata os dados pessoais coletados no site da campanha Natal Solidário.",
};

const classeH2 = "text-lg font-bold text-ink mt-10 mb-3";
const classeH3 = "text-[15px] font-bold text-ink mt-6 mb-2";
const classeP = "text-[14.5px] leading-7 text-stone-600 mb-3";
const classeUl = "list-disc pl-6 space-y-1.5 text-[14.5px] leading-7 text-stone-600 mb-3";

// Texto da versão 1.0 (VERSAO_POLITICA em lib/politica.ts). Ao mudar o texto de forma
// relevante, suba a versão para que todos vejam a tela de aceite de novo.
export default function PoliticaDePrivacidade() {
  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-3xl mx-auto px-4 py-14">
        <h1 className="text-2xl font-bold text-ink mb-1">
          Política de Privacidade — Natal Solidário Sempre Criança
        </h1>
        <p className="text-sm text-stone-500 mb-8">
          Versão 1.0 — vigente a partir de 06/11/2026
        </p>

        <p className={classeP}>
          Esta Política explica como a Sempre Criança trata os dados pessoais coletados no site da
          campanha Natal Solidário, utilizado para o apadrinhamento de cartas de Natal. Ela foi
          elaborada de acordo com a Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018 —
          LGPD).
        </p>

        <h2 className={classeH2}>1. Quem é responsável pelos dados</h2>
        <p className={classeP}>
          A responsável pelo tratamento dos dados (controladora) é a Sempre Criança, associação civil
          sem fins lucrativos com sede em Niterói (RJ), CNPJ 12.629.489/0001-44.
        </p>
        <p className={classeP}>Contato para assuntos de privacidade: contato@semprecrianca.org.</p>

        <h2 className={classeH2}>2. Quais dados coletamos</h2>
        <h3 className={classeH3}>Dos padrinhos e das madrinhas</h3>
        <ul className={classeUl}>
          <li>Nome, e-mail e telefone, informados no cadastro.</li>
          <li>Senha, armazenada de forma criptografada (não temos acesso à senha original).</li>
          <li>Cartas apadrinhadas, datas de apadrinhamento e eventuais desistências.</li>
          <li>Data e versão do aceite desta Política.</li>
        </ul>
        <h3 className={classeH3}>Das crianças atendidas</h3>
        <ul className={classeUl}>
          <li>Primeiro nome, idade, texto e imagem da carta e presente pedido.</li>
          <li>Instituição parceira à qual a criança está vinculada.</li>
          <li>
            Quando necessário, observações sobre necessidades especiais (como deficiência ou
            alergia), para que o presente seja adequado à criança.
          </li>
        </ul>
        <p className={classeP}>
          Não coletamos sobrenome, endereço, documentos ou contato das crianças.
        </p>

        <h2 className={classeH2}>3. Para que usamos os dados</h2>
        <ul className={classeUl}>
          <li>
            <strong>Padrinhos:</strong> permitir o cadastro e o acesso ao site, registrar os
            apadrinhamentos, enviar e-mails de confirmação, lembretes de prazo e aviso de entrega do
            presente, e permitir que a equipe entre em contato sobre a entrega.
          </li>
          <li>
            <strong>Crianças:</strong> apresentar as cartas para apadrinhamento e garantir que cada
            presente chegue à criança certa.
          </li>
        </ul>
        <p className={classeP}>
          Os dados não são usados para fins comerciais, publicidade ou venda a terceiros.
        </p>

        <h2 className={classeH2}>4. Base legal</h2>
        <ul className={classeUl}>
          <li>
            Os dados dos padrinhos são tratados com base no consentimento do titular, manifestado no
            aceite desta Política, e para a execução das atividades solicitadas por ele no site, como
            o apadrinhamento (art. 7º, I e V, da LGPD).
          </li>
          <li>
            Os dados das crianças são tratados no seu melhor interesse (art. 14 da LGPD),
            exclusivamente para a realização da campanha. Eles são fornecidos pelas instituições
            parceiras.
          </li>
          <li>
            As observações sobre necessidades especiais são dados sensíveis (art. 11 da LGPD) e ficam
            visíveis apenas para a equipe organizadora.
          </li>
        </ul>

        <h2 className={classeH2}>5. Quem tem acesso aos dados</h2>
        <ul className={classeUl}>
          <li>
            <strong>Público em geral:</strong> vê apenas as cartas disponíveis para apadrinhamento
            (primeiro nome, idade, texto e imagem da carta, presente pedido e categoria). Dados de
            padrinhos e observações especiais nunca são exibidos publicamente.
          </li>
          <li>
            <strong>Padrinho:</strong> vê as próprias cartas apadrinhadas e o andamento de cada
            presente.
          </li>
          <li>
            <strong>Equipe organizadora:</strong> acessa os dados necessários para a gestão da
            campanha, com níveis de acesso diferentes conforme a função.
          </li>
        </ul>
        <p className={classeP}>
          Para funcionar, o site utiliza serviços de terceiros que tratam dados em nosso nome:
        </p>
        <ul className={classeUl}>
          <li>Vercel: hospedagem do site;</li>
          <li>Hostinger: hospedagem do banco de dados;</li>
          <li>Cloudinary: armazenamento das imagens das cartas;</li>
          <li>Resend: envio dos e-mails automáticos.</li>
        </ul>
        <p className={classeP}>Alguns desses serviços podem armazenar dados fora do Brasil.</p>

        <h2 className={classeH2}>6. Por quanto tempo guardamos os dados</h2>
        <ul className={classeUl}>
          <li>
            <strong>Dados das cartas e registros de desistência:</strong> apagados automaticamente
            seis meses após o encerramento de cada campanha, incluindo as imagens das cartas.
            Mantemos apenas totais numéricos (por exemplo, quantidade de cartas entregues), sem
            dados pessoais.
          </li>
          <li>
            <strong>Conta do padrinho:</strong> mantida até que o próprio padrinho a exclua.
          </li>
          <li>
            Quando o padrinho exclui a conta, nome e e-mail podem permanecer associados às cartas já
            entregues até a limpeza da respectiva campanha, para fins de registro da entrega.
          </li>
        </ul>

        <h2 className={classeH2}>7. Seus direitos</h2>
        <p className={classeP}>Você pode, a qualquer momento:</p>
        <ul className={classeUl}>
          <li>consultar e corrigir seus dados na sua área do site;</li>
          <li>excluir sua conta diretamente na sua área do site;</li>
          <li>
            solicitar informações sobre o tratamento dos seus dados, revogar o consentimento ou
            exercer os demais direitos previstos no art. 18 da LGPD pelo e-mail contato@semprecrianca.org.
          </li>
        </ul>

        <h2 className={classeH2}>8. Segurança</h2>
        <p className={classeP}>
          Adotamos medidas para proteger os dados, como senhas criptografadas, sessões que podem ser
          encerradas, limite de tentativas de acesso e controle de permissões da equipe.
        </p>

        <h2 className={classeH2}>9. Cookies e armazenamento no navegador</h2>
        <p className={classeP}>
          Utilizamos apenas um cookie essencial, que mantém você conectado ao site. As cartas
          adicionadas ao carrinho ficam salvas no seu próprio navegador até a finalização do
          apadrinhamento. Não usamos cookies de publicidade ou rastreamento.
        </p>

        <h2 className={classeH2}>10. Alterações desta Política</h2>
        <p className={classeP}>
          Esta Política pode ser atualizada. Quando houver mudança relevante, pediremos novamente o
          seu aceite ao acessar o site.
        </p>
      </div>
    </div>
  );
}
