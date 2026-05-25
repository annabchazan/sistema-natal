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

interface RecuperacaoSenhaProps {
  linkRedefinicao: string;
}

export default function RecuperacaoSenha({ linkRedefinicao }: RecuperacaoSenhaProps) {
  return (
    <Html lang="pt-BR">
      <Head />
      <Preview>{"Redefinição de senha — Natal Solidário"}</Preview>
      <Body style={estilos.body}>
        <Container style={estilos.container}>

          <Section style={estilos.cabecalho}>
            <Text style={estilos.emoji}>🎄</Text>
            <Heading style={estilos.titulo}>Natal Solidário</Heading>
            <Text style={estilos.subtitulo}>Redefinição de senha</Text>
          </Section>

          <Section style={estilos.conteudo}>
            <Heading as="h2" style={estilos.saudacao}>
              Esqueceu sua senha?
            </Heading>
            <Text style={estilos.texto}>
              Recebemos uma solicitação para redefinir a senha da sua conta.
              Clique no botão abaixo para criar uma nova senha.
            </Text>
            <Text style={estilos.texto}>
              Este link é válido por <strong>1 hora</strong>. Após esse prazo,
              você precisará solicitar um novo.
            </Text>
          </Section>

          <Section style={estilos.secaoBotao}>
            <Button href={linkRedefinicao} style={estilos.botao}>
              Redefinir minha senha
            </Button>
          </Section>

          <Hr style={estilos.divisor} />

          <Section style={estilos.conteudo}>
            <Text style={estilos.textoAvisoTitulo}>
              Não solicitou a redefinição?
            </Text>
            <Text style={estilos.textoAviso}>
              Se você não fez essa solicitação, pode ignorar este e-mail com
              segurança. Sua senha permanece a mesma.
            </Text>
          </Section>

          <Section style={estilos.rodape}>
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
    maxWidth: "520px",
    overflow: "hidden",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
  },
  cabecalho: {
    background: "linear-gradient(135deg, #dc2626 0%, #16a34a 100%)",
    padding: "32px 40px",
    textAlign: "center" as const,
  },
  emoji: { fontSize: "48px", margin: "0 0 8px 0", lineHeight: "1" },
  titulo: { color: "#ffffff", fontSize: "24px", fontWeight: "700", margin: "0 0 4px 0" },
  subtitulo: { color: "rgba(255,255,255,0.85)", fontSize: "14px", margin: "0" },
  conteudo: { padding: "28px 40px" },
  saudacao: { color: "#111827", fontSize: "20px", fontWeight: "700", margin: "0 0 12px 0" },
  texto: { color: "#374151", fontSize: "15px", lineHeight: "1.6", margin: "0 0 12px 0" },
  secaoBotao: { padding: "0 40px 28px", textAlign: "center" as const },
  botao: {
    backgroundColor: "#dc2626",
    borderRadius: "8px",
    color: "#ffffff",
    display: "inline-block",
    fontSize: "15px",
    fontWeight: "700",
    padding: "14px 32px",
    textDecoration: "none",
  },
  divisor: { borderColor: "#e5e7eb", margin: "0 40px" },
  textoAvisoTitulo: { color: "#6b7280", fontSize: "13px", fontWeight: "600", margin: "0 0 4px 0" },
  textoAviso: { color: "#9ca3af", fontSize: "13px", lineHeight: "1.6", margin: "0" },
  rodape: { backgroundColor: "#f9fafb", padding: "20px 40px" },
  textoRodape: { color: "#9ca3af", fontSize: "13px", lineHeight: "1.6", margin: "0" },
};
