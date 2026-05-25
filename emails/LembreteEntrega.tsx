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

interface LembreteEntregaProps {
  nomePadrinho: string;
  nomeCrianca: string;
  presentePedido: string;
  dataLimite: string | null;
  numeroSequencial: number | null;
  tipo: "10d" | "vencido";
  urlSite: string;
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

export default function LembreteEntrega({
  nomePadrinho,
  nomeCrianca,
  presentePedido,
  dataLimite,
  numeroSequencial,
  tipo,
  urlSite,
}: LembreteEntregaProps) {
  const primeiroNome = nomePadrinho.split(" ")[0];
  const vencido = tipo === "vencido";

  const previewText = vencido
    ? `⚠️ O prazo para entregar o presente de ${nomeCrianca} venceu`
    : `⏰ Faltam 10 dias para entregar o presente de ${nomeCrianca}`;

  const corDestaque = vencido ? "#dc2626" : "#d97706";
  const emoji = vencido ? "⚠️" : "⏰";

  return (
    <Html lang="pt-BR">
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={estilos.body}>
        <Container style={estilos.container}>

          {/* Cabeçalho */}
          <Section style={{ ...estilos.cabecalho, background: vencido ? "#dc2626" : "#d97706" }}>
            <Text style={estilos.emojiGrande}>{emoji}</Text>
            <Heading style={estilos.tituloCabecalho}>Natal Solidário</Heading>
            <Text style={estilos.subtituloCabecalho}>
              {vencido ? "Prazo de entrega vencido" : "Lembrete de entrega"}
            </Text>
          </Section>

          {/* Saudação */}
          <Section style={estilos.conteudo}>
            <Heading as="h2" style={estilos.saudacao}>
              Olá, {primeiroNome}!
            </Heading>
            <Text style={estilos.texto}>
              {vencido ? (
                <>
                  O prazo para entregar o presente de <strong>{nomeCrianca}</strong> já passou.
                  Por favor, entre em contato com nossa equipe o quanto antes para que possamos
                  garantir que a criança receba o presente antes do Natal.
                </>
              ) : (
                <>
                  Você tem <strong>10 dias</strong> para entregar o presente de{" "}
                  <strong>{nomeCrianca}</strong>. Não esqueça — uma criança está esperando!
                </>
              )}
            </Text>
          </Section>

          <Hr style={estilos.divisor} />

          {/* Card da cartinha */}
          <Section style={estilos.conteudo}>
            <Heading as="h3" style={estilos.tituloSecao}>🎁 Detalhes da cartinha</Heading>
            <Section style={{ ...estilos.card, borderColor: corDestaque }}>
              <Text style={{ ...estilos.nomeCartinha, color: corDestaque }}>
                {numeroSequencial != null ? `#${numeroSequencial} — ` : ""}
                {nomeCrianca}
              </Text>
              <Text style={estilos.detalhe}>
                <strong>Presente desejado:</strong> {presentePedido}
              </Text>
              <Text style={{ ...estilos.prazo, color: corDestaque }}>
                📅 {vencido ? "Prazo vencido em: " : "Entregar até: "}
                {formatarData(dataLimite)}
              </Text>
            </Section>
          </Section>

          <Hr style={estilos.divisor} />

          {/* Próximos passos */}
          <Section style={estilos.conteudo}>
            <Heading as="h3" style={estilos.tituloSecao}>
              {vencido ? "O que fazer agora?" : "Próximos passos"}
            </Heading>
            {vencido ? (
              <>
                <Text style={estilos.passo}>
                  <strong>1.</strong> Se ainda não comprou o presente, adquira com urgência.
                </Text>
                <Text style={estilos.passo}>
                  <strong>2.</strong> Entre em contato com a equipe pelo WhatsApp para combinar a entrega.
                </Text>
              </>
            ) : (
              <>
                <Text style={estilos.passo}>
                  <strong>1.</strong> Compre o presente pedido pela criança.
                </Text>
                <Text style={estilos.passo}>
                  <strong>2.</strong> Leve embrulhado a um dos nossos pontos de entrega até a data limite.
                </Text>
                <Text style={estilos.passo}>
                  <strong>3.</strong> Acompanhe o status pela sua área no site.
                </Text>
              </>
            )}
          </Section>

          {/* Botões */}
          <Section style={estilos.secaoBotoes}>
            <Button href={`${urlSite}/pontos-entrega`} style={estilos.botaoPrimario}>
              Ver pontos de entrega
            </Button>
            <Text style={estilos.separador}> </Text>
            <Button href={`${urlSite}/usuario`} style={estilos.botaoSecundario}>
              Minha área
            </Button>
          </Section>

          <Hr style={estilos.divisor} />

          {/* Rodapé */}
          <Section style={estilos.rodape}>
            <Text style={estilos.textoRodape}>
              Dúvidas? Acesse nossa{" "}
              <a href={`${urlSite}/duvidas-frequentes`} style={estilos.link}>
                página de perguntas frequentes
              </a>{" "}
              ou fale conosco pelo WhatsApp.
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
    padding: "32px 40px",
    textAlign: "center" as const,
  },
  emojiGrande: {
    fontSize: "48px",
    margin: "0 0 8px 0",
    lineHeight: "1",
  },
  tituloCabecalho: {
    color: "#ffffff",
    fontSize: "26px",
    fontWeight: "700",
    margin: "0 0 4px 0",
  },
  subtituloCabecalho: {
    color: "rgba(255,255,255,0.9)",
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
  card: {
    backgroundColor: "#fff7ed",
    border: "1px solid",
    borderRadius: "8px",
    padding: "16px 20px",
  },
  nomeCartinha: {
    fontSize: "16px",
    fontWeight: "700",
    margin: "0 0 6px 0",
  },
  detalhe: {
    color: "#374151",
    fontSize: "14px",
    margin: "0 0 4px 0",
  },
  prazo: {
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
  secaoBotoes: {
    padding: "8px 40px 28px",
    textAlign: "center" as const,
  },
  botaoPrimario: {
    backgroundColor: "#16a34a",
    borderRadius: "8px",
    color: "#ffffff",
    display: "inline-block",
    fontSize: "14px",
    fontWeight: "700",
    padding: "12px 24px",
    textDecoration: "none",
    marginBottom: "8px",
  },
  separador: {
    display: "block",
    height: "8px",
  },
  botaoSecundario: {
    backgroundColor: "#f3f4f6",
    borderRadius: "8px",
    color: "#374151",
    display: "inline-block",
    fontSize: "14px",
    fontWeight: "600",
    padding: "12px 24px",
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
