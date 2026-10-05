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

interface CancelamentoApadrinamentoProps {
  nomePadrinho: string;
  nomeCrianca: string;
  presentePedido: string;
  numeroSequencial: number | null;
  urlSite: string;
}

export default function CancelamentoApadrinamento({
  nomePadrinho,
  nomeCrianca,
  presentePedido,
  numeroSequencial,
  urlSite,
}: CancelamentoApadrinamentoProps) {
  const primeiroNome = nomePadrinho.split(" ")[0];

  return (
    <Html lang="pt-BR">
      <Head />
      <Preview>Apadrinhamento de {nomeCrianca} cancelado — a cartinha voltou para a lista.</Preview>
      <Body style={estilos.body}>
        <Container style={estilos.container}>

          <Cabecalho rotulo="Natal Solidário · Cancelamento confirmado" urlSite={urlSite} />

          <Section style={estilos.conteudo}>
            <Heading as="h2" style={estilos.saudacao}>
              Olá, {primeiroNome}!
            </Heading>
            <Text style={estilos.texto}>
              O cancelamento do seu apadrinhamento foi confirmado. A cartinha de{" "}
              <strong>{nomeCrianca}</strong> voltou para a lista e poderá ser apadrinhada
              por outra pessoa.
            </Text>
          </Section>

          <Hr style={estilos.divisor} />

          <Section style={estilos.conteudo}>
            <Section style={{ ...estilos.card, borderLeftColor: cores.borda }}>
              <Text style={estilos.nomeCartinha}>
                {numeroSequencial != null ? `#${numeroSequencial} — ` : ""}
                {nomeCrianca}
              </Text>
              <Text style={estilos.detalhe}>
                <strong>Presente:</strong> {presentePedido}
              </Text>
              <Text style={{ ...estilos.status, color: cores.textoSuave }}>
                Apadrinhamento cancelado
              </Text>
            </Section>
          </Section>

          <Hr style={estilos.divisor} />

          <Section style={estilos.conteudo}>
            <Text style={{ ...estilos.texto, margin: "0" }}>
              Se foi um engano ou mudou de ideia, ainda há tempo — acesse o site e
              escolha uma nova cartinha para apadrinhar.
            </Text>
          </Section>

          <Section style={estilos.secaoBotao}>
            <Button href={urlSite} style={estilos.botao}>
              Ver cartinhas disponíveis
            </Button>
          </Section>

          <Hr style={estilos.divisor} />

          <Section style={estilos.rodape}>
            <Text style={{ ...estilos.textoRodape, color: cores.textoCorpo, margin: "0" }}>
              Com carinho,
              <br />
              <strong>Equipe Sempre Criança</strong> 🎄
            </Text>
          </Section>

        </Container>
      </Body>
    </Html>
  );
}
