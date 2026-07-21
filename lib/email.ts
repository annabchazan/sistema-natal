import { Resend } from "resend";
import { createElement } from "react";
import ConfirmacaoApadrinhamento from "@/emails/ConfirmacaoApadrinhamento";
import RecuperacaoSenha from "@/emails/RecuperacaoSenha";
import LembreteEntrega from "@/emails/LembreteEntrega";
import PresenteEntregue from "@/emails/PresenteEntregue";
import CancelamentoApadrinamento from "@/emails/CancelamentoApadrinamento";
import AvisoDesistenciaEquipe from "@/emails/AvisoDesistenciaEquipe";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = `${process.env.EMAIL_FROM_NAME ?? "Natal Solidário"} <${process.env.EMAIL_FROM ?? "onboarding@resend.dev"}>`;
const EMAIL_EQUIPE_CARTINHAS = "cartinhas@semprecrianca.org";

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

export async function enviarLembreteEntrega({
  nomePadrinho,
  emailPadrinho,
  nomeCrianca,
  presentePedido,
  dataLimite,
  numeroSequencial,
  tipo,
}: {
  nomePadrinho: string;
  emailPadrinho: string;
  nomeCrianca: string;
  presentePedido: string;
  dataLimite: string | null;
  numeroSequencial: number | null;
  tipo: "10d" | "vencido";
}) {
  const urlSite = process.env.NEXT_PUBLIC_URL ?? "http://localhost:3000";
  const assunto =
    tipo === "vencido"
      ? `⚠️ Prazo vencido — presente de ${nomeCrianca} aguarda entrega`
      : `⏰ Faltam 10 dias para entregar o presente de ${nomeCrianca}`;

  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to: emailPadrinho,
      subject: assunto,
      react: createElement(LembreteEntrega, {
        nomePadrinho,
        nomeCrianca,
        presentePedido,
        dataLimite,
        numeroSequencial,
        tipo,
        urlSite,
      }),
    });
    if (error) {
      console.error(`Resend erro (lembrete ${tipo}):`, error);
      return { ok: false };
    }
    return { ok: true };
  } catch (err) {
    console.error(`Erro ao enviar lembrete ${tipo}:`, err);
    return { ok: false };
  }
}

export async function enviarCancelamentoApadrinamento({
  nomePadrinho,
  emailPadrinho,
  nomeCrianca,
  presentePedido,
  numeroSequencial,
}: {
  nomePadrinho: string;
  emailPadrinho: string;
  nomeCrianca: string;
  presentePedido: string;
  numeroSequencial: number | null;
}) {
  const urlSite = process.env.NEXT_PUBLIC_URL ?? "http://localhost:3000";
  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to: emailPadrinho,
      subject: `Apadrinhamento de ${nomeCrianca} cancelado`,
      react: createElement(CancelamentoApadrinamento, {
        nomePadrinho,
        nomeCrianca,
        presentePedido,
        numeroSequencial,
        urlSite,
      }),
    });
    if (error) {
      console.error("Resend erro (cancelamento):", error);
      return { ok: false };
    }
    return { ok: true };
  } catch (err) {
    console.error("Erro ao enviar e-mail de cancelamento:", err);
    return { ok: false };
  }
}

export async function enviarAvisoDesistenciaEquipe({
  nomePadrinho,
  emailPadrinho,
  nomeCrianca,
  numeroSequencial,
}: {
  nomePadrinho: string;
  emailPadrinho: string;
  nomeCrianca: string;
  numeroSequencial: number | null;
}) {
  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to: EMAIL_EQUIPE_CARTINHAS,
      subject: `Desistência: ${nomeCrianca}${numeroSequencial != null ? ` (#${numeroSequencial})` : ""}`,
      react: createElement(AvisoDesistenciaEquipe, {
        nomePadrinho,
        emailPadrinho,
        nomeCrianca,
        numeroSequencial,
      }),
    });
    if (error) {
      console.error("Resend erro (aviso desistência equipe):", error);
      return { ok: false };
    }
    return { ok: true };
  } catch (err) {
    console.error("Erro ao enviar aviso de desistência para a equipe:", err);
    return { ok: false };
  }
}

export async function enviarNotificacaoEntrega({
  nomePadrinho,
  emailPadrinho,
  nomeCrianca,
  presentePedido,
  numeroSequencial,
}: {
  nomePadrinho: string;
  emailPadrinho: string;
  nomeCrianca: string;
  presentePedido: string;
  numeroSequencial: number | null;
}) {
  const urlSite = process.env.NEXT_PUBLIC_URL ?? "http://localhost:3000";
  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to: emailPadrinho,
      subject: `🎉 ${nomeCrianca} recebeu o presente! Obrigado, ${nomePadrinho.split(" ")[0]}!`,
      react: createElement(PresenteEntregue, {
        nomePadrinho,
        nomeCrianca,
        presentePedido,
        numeroSequencial,
        urlSite,
      }),
    });
    if (error) {
      console.error("Resend erro (presente entregue):", error);
      return { ok: false };
    }
    return { ok: true };
  } catch (err) {
    console.error("Erro ao enviar notificação de entrega:", err);
    return { ok: false };
  }
}
