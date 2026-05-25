import { Resend } from "resend";
import { createElement } from "react";
import ConfirmacaoApadrinhamento from "@/emails/ConfirmacaoApadrinhamento";
import RecuperacaoSenha from "@/emails/RecuperacaoSenha";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = `${process.env.EMAIL_FROM_NAME ?? "Natal Solidário"} <${process.env.EMAIL_FROM ?? "onboarding@resend.dev"}>`;

interface CartinhaEmail {
  nome_crianca: string;
  presente_pedido: string;
  data_limite_entrega: string | null;
  numero_sequencial: number | null;
}

export async function enviarEmailRecuperacaoSenha({
  email,
  linkRedefinicao,
}: {
  email: string;
  linkRedefinicao: string;
}) {
  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to: email,
      subject: "Redefinição de senha — Natal Solidário",
      react: createElement(RecuperacaoSenha, { linkRedefinicao }),
    });
    if (error) console.error("Resend erro (recuperação de senha):", error);
  } catch (err) {
    console.error("Erro ao enviar e-mail de recuperação:", err);
  }
}

export async function enviarConfirmacaoApadrinhamento({
  nomePadrinho,
  emailPadrinho,
  cartinhas,
}: {
  nomePadrinho: string;
  emailPadrinho: string;
  cartinhas: CartinhaEmail[];
}) {
  const total = cartinhas.length;

  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to: emailPadrinho,
      subject: `🎄 Você apadrinhou ${total} cartinha${total !== 1 ? "s" : ""} de Natal!`,
      react: createElement(ConfirmacaoApadrinhamento, { nomePadrinho, cartinhas }),
    });

    if (error) {
      console.error("Resend retornou erro:", error);
      return { ok: false };
    }

    return { ok: true };
  } catch (err) {
    console.error("Erro ao enviar e-mail de confirmação:", err);
    return { ok: false };
  }
}
