import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface AvisoDesistenciaEquipeProps {
  nomePadrinho: string;
  emailPadrinho: string;
  nomeCrianca: string;
  numeroSequencial: number | null;
}

export default function AvisoDesistenciaEquipe({
  nomePadrinho,
  emailPadrinho,
  nomeCrianca,
  numeroSequencial,
}: AvisoDesistenciaEquipeProps) {
  return (
    <Html lang="pt-BR">
      <Head />
      <Preview>
        {nomePadrinho} desistiu do apadrinhamento de {nomeCrianca}
      </Preview>
      <Body style={estilos.body}>
        <Container style={estilos.container}>
          <Section style={estilos.conteudo}>
            <Heading as="h2" style={estilos.titulo}>
              ⚠️ Desistência de apadrinhamento
            </Heading>
            <Text style={estilos.texto}>
              <strong>{nomePadrinho}</strong> ({emailPadrinho}) desistiu do
              apadrinhamento de{" "}
              <strong>
                {numeroSequencial != null ? `#${numeroSequencial} — ` : ""}
                {nomeCrianca}
              </strong>
              .
            </Text>
          </Section>

          <Hr style={estilos.divisor} />

          <Section style={estilos.conteudo}>
            <Text style={estilos.texto}>
              A cartinha voltou automaticamente para a lista de disponíveis.
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
  conteudo: {
    padding: "24px 32px",
  },
  titulo: {
    color: "#111827",
    fontSize: "20px",
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
    margin: "0 32px",
  },
};
