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

          {/* Cabeçalho */}
          <Section style={estilos.cabecalho}>
            <Text style={estilos.emoji}>🎄</Text>
            <Heading style={estilos.titulo}>Natal Solidário</Heading>
            <Text style={estilos.subtitulo}>Confirmação de Apadrinhamento</Text>
          </Section>

          {/* Mensagem de boas-vindas */}
          <Section style={estilos.conteudo}>
            <Heading as="h2" style={estilos.saudacao}>
              Que alegria, {primeiroNome}!
            </Heading>
            <Text style={estilos.texto}>
              Seu apadrinhamento foi confirmado com sucesso. Você vai transformar
              o Natal de {totalCartinhas === 1 ? "uma criança especial" : `${totalCartinhas} crianças especiais`}.
              Obrigado por fazer parte disso!
            </Text>
          </Section>

          <Hr style={estilos.divisor} />

          {/* Lista de cartinhas */}
          <Section style={estilos.conteudo}>
            <Heading as="h3" style={estilos.tituloSecao}>
              🎁 {totalCartinhas === 1 ? "Sua cartinha" : "Suas cartinhas"}
            </Heading>

            {cartinhas.map((cartinha, index) => (
              <Section key={`cartinha-${index}`} style={estilos.cardCartinha}>
                <Text style={estilos.nomeCartinha}>
                  {cartinha.numero_sequencial != null
                    ? `#${cartinha.numero_sequencial} — `
                    : ""}
                  {cartinha.nome_crianca}
                </Text>
                <Text style={estilos.detalheCartinha}>
                  <strong>Presente desejado:</strong> {cartinha.presente_pedido}
                </Text>
                <Text style={estilos.prazoCartinha}>
                  📅 Entregar até: {formatarData(cartinha.data_limite_entrega)}
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
              <strong>2.</strong> Leve embrulhado a um dos nossos pontos de entrega
              até a data limite.
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
            <Text style={estilos.textoRodape}>
              Com carinho,
              <br />
              <strong>Equipe Natal Solidário</strong> 🎅
            </Text>
          </Section>

        </Container>
      </Body>
    </Html>
  );
}

const estilos = {
  body: {
    backgroundColor: "#f9fafb",
    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
    margin: "0",
    padding: "20px 0",
  },
  container: {
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    margin: "0 auto",
    maxWidth: "560px",
    overflow: "hidden",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
  },
  cabecalho: {
    background: "linear-gradient(135deg, #dc2626 0%, #16a34a 100%)",
    padding: "32px 40px",
    textAlign: "center" as const,
  },
  emoji: {
    fontSize: "48px",
    margin: "0 0 8px 0",
    lineHeight: "1",
  },
  titulo: {
    color: "#ffffff",
    fontSize: "26px",
    fontWeight: "700",
    margin: "0 0 4px 0",
  },
  subtitulo: {
    color: "rgba(255,255,255,0.85)",
    fontSize: "14px",
    margin: "0",
  },
  conteudo: {
    padding: "28px 40px",
  },
  saudacao: {
    color: "#111827",
    fontSize: "22px",
    fontWeight: "700",
    margin: "0 0 12px 0",
  },
  texto: {
    color: "#374151",
    fontSize: "15px",
    lineHeight: "1.6",
    margin: "0",
  },
  divisor: {
    borderColor: "#e5e7eb",
    margin: "0 40px",
  },
  tituloSecao: {
    color: "#111827",
    fontSize: "16px",
    fontWeight: "700",
    margin: "0 0 16px 0",
  },
  cardCartinha: {
    backgroundColor: "#fef2f2",
    border: "1px solid #fecaca",
    borderRadius: "8px",
    marginBottom: "12px",
    padding: "16px 20px",
  },
  nomeCartinha: {
    color: "#dc2626",
    fontSize: "16px",
    fontWeight: "700",
    margin: "0 0 6px 0",
  },
  detalheCartinha: {
    color: "#374151",
    fontSize: "14px",
    margin: "0 0 4px 0",
  },
  prazoCartinha: {
    color: "#d97706",
    fontSize: "13px",
    fontWeight: "600",
    margin: "0",
  },
  passo: {
    color: "#374151",
    fontSize: "14px",
    lineHeight: "1.6",
    margin: "0 0 8px 0",
  },
  secaoBotao: {
    padding: "8px 40px 28px",
    textAlign: "center" as const,
  },
  botao: {
    backgroundColor: "#16a34a",
    borderRadius: "8px",
    color: "#ffffff",
    display: "inline-block",
    fontSize: "15px",
    fontWeight: "700",
    padding: "12px 28px",
    textDecoration: "none",
  },
  rodape: {
    backgroundColor: "#f9fafb",
    padding: "24px 40px",
  },
  textoRodape: {
    color: "#9ca3af",
    fontSize: "13px",
    lineHeight: "1.6",
    margin: "0 0 8px 0",
  },
  link: {
    color: "#dc2626",
  },
};
