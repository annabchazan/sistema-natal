import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import Cabecalho from "./Cabecalho";
import { cores, estilos } from "./tema";

interface Cartinha {
  nome_crianca: string;
  presente_pedido: string;
  data_limite_entrega: string | null;
  numero_sequencial: number | null;
}

interface ConfirmacaoApadrinhamentoProps {
  nomePadrinho: string;
  cartinhas: Cartinha[];
}

function formatarData(data: string | null): string {
  if (!data) return "a combinar";
  return new Date(data).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default function ConfirmacaoApadrinhamento({
  nomePadrinho,
  cartinhas,
}: ConfirmacaoApadrinhamentoProps) {
  const primeiroNome = nomePadrinho.split(" ")[0];
  const totalCartinhas = cartinhas.length;

  return (
    <Html lang="pt-BR">
      <Head />
      <Preview>
        {`Você apadrinhou ${totalCartinhas} cartinha${totalCartinhas !== 1 ? "s" : ""} de Natal!`}
      </Preview>
      <Body style={estilos.body}>
        <Container style={estilos.container}>

          <Cabecalho rotulo="Natal Solidário · Apadrinhamento confirmado" />

          {/* Mensagem de boas-vindas */}
          <Section style={estilos.conteudo}>
            <Heading as="h2" style={estilos.saudacao}>
              Que alegria, {primeiroNome}!
            </Heading>
            <Text style={estilos.texto}>
              Seu apadrinhamento foi confirmado com sucesso. Você vai tornar o
              Natal de {totalCartinhas === 1 ? "uma criança" : `${totalCartinhas} crianças`} muito mais especial.
              Obrigado por fazer parte disso!
            </Text>
          </Section>

          <Hr style={estilos.divisor} />

          {/* Lista de cartinhas */}
          <Section style={estilos.conteudo}>
            <Heading as="h3" style={estilos.tituloSecao}>
              {totalCartinhas === 1 ? "Sua cartinha" : "Suas cartinhas"}
            </Heading>

            {cartinhas.map((cartinha, index) => (
              <Section key={`cartinha-${index}`} style={estilos.card}>
                <Text style={estilos.nomeCartinha}>
                  {cartinha.numero_sequencial != null
                    ? `#${cartinha.numero_sequencial} — `
                    : ""}
                  {cartinha.nome_crianca}
                </Text>
                <Text style={estilos.detalhe}>
                  <strong>Presente desejado:</strong> {cartinha.presente_pedido}
                </Text>
                <Text style={estilos.status}>
                  Entregar até {formatarData(cartinha.data_limite_entrega)}
                </Text>
              </Section>
            ))}
          </Section>

          <Hr style={estilos.divisor} />

          {/* Próximos passos */}
          <Section style={estilos.conteudo}>
            <Heading as="h3" style={estilos.tituloSecao}>
              Próximos passos
            </Heading>
            <Text style={estilos.passo}>
              <strong>1.</strong> Compre o presente pedido pela criança.
            </Text>
            <Text style={estilos.passo}>
              <strong>2.</strong> Leve a um dos nossos pontos de entrega
              até a data limite, <strong>sem embrulhar</strong>: nossa equipe
              confere os itens antes. Se puder, leve também papel de presente
              para a embalagem.
            </Text>
            <Text style={estilos.passo}>
              <strong>3.</strong> Acompanhe o status do seu apadrinhamento pela
              sua área no site.
            </Text>
          </Section>

          {/* Botão CTA */}
          <Section style={estilos.secaoBotao}>
            <Button href={`${process.env.NEXT_PUBLIC_URL ?? ""}/pontos-entrega`} style={estilos.botao}>
              Ver pontos de entrega
            </Button>
          </Section>

          <Hr style={estilos.divisor} />

          {/* Rodapé */}
          <Section style={estilos.rodape}>
            <Text style={estilos.textoRodape}>
              Dúvidas? Fale conosco pelo WhatsApp ou acesse a página de{" "}
              <a href={`${process.env.NEXT_PUBLIC_URL ?? ""}/duvidas-frequentes`} style={estilos.link}>
                perguntas frequentes
              </a>
              .
            </Text>
            <Text style={{ ...estilos.textoRodape, color: cores.textoCorpo }}>
              Com carinho,
              <br />
              <strong>Equipe Sempre Criança</strong> 🎅
            </Text>
          </Section>

        </Container>
      </Body>
    </Html>
  );
}
