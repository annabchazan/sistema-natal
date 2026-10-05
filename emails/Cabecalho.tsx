import { Img, Section, Text } from "@react-email/components";
import { cores } from "./tema";

// Igual ao header do site: faixa laranja, fundo creme, logo e linha de pedra na base.
export default function Cabecalho({ rotulo, urlSite }: { rotulo: string; urlSite?: string }) {
  const base = urlSite ?? process.env.NEXT_PUBLIC_URL ?? "";
  return (
    <>
      <Section style={{ backgroundColor: cores.marca, height: "6px", lineHeight: "6px", fontSize: "0" }} />
      <Section
        style={{
          backgroundColor: cores.creme,
          borderBottom: `1px solid ${cores.borda}`,
          padding: "14px 40px",
          textAlign: "center" as const,
        }}
      >
        <Img
          src={`${base}/logo_natalina.png`}
          alt="Sempre Criança"
          width="105"
          height="88"
          style={{ display: "block", margin: "0 auto", height: "88px", width: "105px" }}
        />
      </Section>
      <Section style={{ padding: "24px 40px 0", textAlign: "center" as const }}>
        <Text
          style={{
            color: cores.marcaEscura,
            fontSize: "11px",
            fontWeight: "700",
            letterSpacing: "0.14em",
            textTransform: "uppercase" as const,
            margin: "0",
          }}
        >
          {rotulo}
        </Text>
      </Section>
    </>
  );
}
