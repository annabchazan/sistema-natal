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

          <Cabecalho rotulo="Natal Solidário · Presente entregue" urlSite={urlSite} />

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
            <Section style={{ ...estilos.card, borderLeftColor: cores.verde }}>
              <Text style={estilos.nomeCartinha}>
                {numeroSequencial != null ? `#${numeroSequencial} — ` : ""}
                {nomeCrianca}
              </Text>
              <Text style={estilos.detalhe}>
                <strong>Presente:</strong> {presentePedido}
              </Text>
              <Text style={{ ...estilos.status, color: cores.verde }}>Entregue com sucesso</Text>
            </Section>
          </Section>

          <Hr style={estilos.divisor} />

          {/* Agradecimento */}
          <Section style={estilos.conteudo}>
            <Text style={{ ...estilos.texto, margin: "0" }}>
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
            <Text style={{ ...estilos.textoRodape, color: cores.textoCorpo, margin: "0" }}>
              Com muito carinho,
              <br />
              <strong>Equipe Sempre Criança</strong> 🎅
            </Text>
          </Section>

        </Container>
      </Body>
    </Html>
  );
}
