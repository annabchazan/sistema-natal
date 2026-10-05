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

          <Cabecalho rotulo="Natal Solidário · Redefinição de senha" />

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
            <Text style={{ ...estilos.textoRodape, fontWeight: "600", margin: "0 0 4px 0" }}>
              Não solicitou a redefinição?
            </Text>
            <Text style={{ ...estilos.textoRodape, margin: "0" }}>
              Se você não fez essa solicitação, pode ignorar este e-mail com
              segurança. Sua senha permanece a mesma.
            </Text>
          </Section>

          <Section style={estilos.rodape}>
            <Text style={{ ...estilos.textoRodape, color: cores.textoCorpo, margin: "0" }}>
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
