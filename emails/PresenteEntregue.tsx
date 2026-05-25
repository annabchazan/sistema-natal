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

interface PresenteEntregueProps {
  nomePadrinho: string;
  nomeCrianca: string;
  presentePedido: string;
  numeroSequencial: number | null;
  urlSite: string;
}

export default function PresenteEntregue({
  nomePadrinho,
  nomeCrianca,
  presentePedido,
  numeroSequencial,
  urlSite,
}: PresenteEntregueProps) {
  const primeiroNome = nomePadrinho.split(" ")[0];

  return (
    <Html lang="pt-BR">
      <Head />
      <Preview>🎉 {nomeCrianca} recebeu o presente! Missão cumprida, {primeiroNome}!</Preview>
      <Body style={estilos.body}>
        <Container style={estilos.container}>

          {/* Cabeçalho */}
          <Section style={estilos.cabecalho}>
            <Text style={estilos.emojiGrande}>🎉</Text>
            <Heading style={estilos.titulo}>Natal Solidário</Heading>
            <Text style={estilos.subtitulo}>Presente entregue!</Text>
          </Section>

          {/* Mensagem principal */}
          <Section style={estilos.conteudo}>
            <Heading as="h2" style={estilos.saudacao}>
              Missão cumprida, {primeiroNome}!
            </Heading>
            <Text style={estilos.texto}>
              O presente de <strong>{nomeCrianca}</strong> foi confirmado como entregue pela nossa equipe.
              Graças a você, essa criança vai ter um Natal muito especial. 🎄
            </Text>
          </Section>

          <Hr style={estilos.divisor} />

          {/* Card da cartinha */}
          <Section style={estilos.conteudo}>
            <Section style={estilos.card}>
              <Text style={estilos.nomeCartinha}>
                {numeroSequencial != null ? `#${numeroSequencial} — ` : ""}
                {nomeCrianca}
              </Text>
              <Text style={estilos.detalhe}>
                <strong>Presente:</strong> {presentePedido}
              </Text>
              <Text style={estilos.statusEntregue}>✓ Entregue com sucesso</Text>
            </Section>
          </Section>

          <Hr style={estilos.divisor} />

          {/* Agradecimento */}
          <Section style={estilos.conteudo}>
            <Text style={estilos.texto}>
              Seu gesto faz parte de uma corrente de bondade que transforma vidas.
              Se quiser continuar essa história no próximo ano, estaremos por aqui.
            </Text>
          </Section>

          {/* Botão */}
          <Section style={estilos.secaoBotao}>
            <Button href={`${urlSite}/usuario`} style={estilos.botao}>
              Ver minha área
            </Button>
          </Section>

          <Hr style={estilos.divisor} />

          {/* Rodapé */}
          <Section style={estilos.rodape}>
            <Text style={estilos.textoRodape}>
              Com muito carinho,
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
    background: "linear-gradient(135deg, #16a34a 0%, #15803d 100%)",
    padding: "32px 40px",
    textAlign: "center" as const,
  },
  emojiGrande: {
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
  card: {
    backgroundColor: "#f0fdf4",
    border: "1px solid #bbf7d0",
    borderRadius: "8px",
    padding: "16px 20px",
  },
  nomeCartinha: {
    color: "#15803d",
    fontSize: "16px",
    fontWeight: "700",
    margin: "0 0 6px 0",
  },
  detalhe: {
    color: "#374151",
    fontSize: "14px",
    margin: "0 0 6px 0",
  },
  statusEntregue: {
    color: "#16a34a",
    fontSize: "13px",
    fontWeight: "700",
    margin: "0",
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
    margin: "0",
  },
};
