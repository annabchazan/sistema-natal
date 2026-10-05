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

  // Vermelho do Natal só quando o prazo venceu; senão, o laranja da marca.
  const corDestaque = vencido ? cores.vermelho : cores.marca;
  const corTexto = vencido ? cores.vermelho : cores.marcaEscura;

  return (
    <Html lang="pt-BR">
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={estilos.body}>
        <Container style={estilos.container}>

          <Cabecalho
            rotulo={`Natal Solidário · ${vencido ? "Prazo de entrega vencido" : "Lembrete de entrega"}`}
            urlSite={urlSite}
          />

          {/* Saudação */}
          <Section style={estilos.conteudo}>
            <Heading as="h2" style={estilos.saudacao}>
              Olá, {primeiroNome}!
            </Heading>
            <Text style={{ ...estilos.texto, margin: "0" }}>
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
            <Heading as="h3" style={estilos.tituloSecao}>Detalhes da cartinha</Heading>
            <Section style={{ ...estilos.card, borderLeftColor: corDestaque }}>
              <Text style={estilos.nomeCartinha}>
                {numeroSequencial != null ? `#${numeroSequencial} — ` : ""}
                {nomeCrianca}
              </Text>
              <Text style={estilos.detalhe}>
                <strong>Presente desejado:</strong> {presentePedido}
              </Text>
              <Text style={{ ...estilos.status, color: corTexto }}>
                {vencido ? "Prazo vencido em " : "Entregar até "}
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
                  <strong>2.</strong> Leve a um dos nossos pontos de entrega até a data limite, <strong>sem embrulhar</strong> (nossa equipe confere os itens antes). Se puder, leve também papel de presente para a embalagem.
                </Text>
                <Text style={estilos.passo}>
                  <strong>3.</strong> Acompanhe o status pela sua área no site.
                </Text>
              </>
            )}
          </Section>

          {/* Botões */}
          <Section style={estilos.secaoBotao}>
            <Button href={`${urlSite}/pontos-entrega`} style={estilos.botao}>
              Ver pontos de entrega
            </Button>
            <Text style={{ display: "block", height: "8px", margin: "0" }}> </Text>
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
