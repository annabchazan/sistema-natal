import { NextResponse } from "next/server";
import { Resend } from "resend";
import { getUsuarioAutenticado, usuarioEhAdmin } from "@/lib/auth";

export async function GET() {
  const usuario = await getUsuarioAutenticado();
  if (!usuario || !usuarioEhAdmin(usuario)) {
    return NextResponse.json({ erro: "Acesso negado" }, { status: 403 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? "onboarding@resend.dev";
  const fromName = process.env.EMAIL_FROM_NAME ?? "Natal Solidário";

  // Diagnóstico das variáveis de ambiente
  const diagnostico = {
    RESEND_API_KEY: apiKey
      ? `configurada (${apiKey.slice(0, 8)}...)`
      : "NÃO CONFIGURADA",
    EMAIL_FROM: from,
    EMAIL_FROM_NAME: fromName,
    destinatario: usuario.email,
  };

  if (!apiKey || apiKey === "sua_chave_aqui") {
    return NextResponse.json({
      ok: false,
      etapa: "configuração",
      mensagem: "RESEND_API_KEY não configurada no .env.local",
      diagnostico,
    });
  }

  const resend = new Resend(apiKey);

  try {
    const { data, error } = await resend.emails.send({
      from: `${fromName} <${from}>`,
      to: usuario.email,
      subject: "Teste — Sistema Natal Solidário",
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
          <h2 style="color:#F8991D">Teste de e-mail</h2>
          <p>Se você recebeu esta mensagem, o Resend está funcionando corretamente!</p>
          <p><strong>Enviado para:</strong> ${usuario.email}</p>
          <p><strong>Remetente:</strong> ${fromName} &lt;${from}&gt;</p>
        </div>
      `,
    });

    if (error) {
      return NextResponse.json({
        ok: false,
        etapa: "envio",
        mensagem: "Resend retornou um erro",
        erro: error,
        diagnostico,
      });
    }

    return NextResponse.json({
      ok: true,
      mensagem: `E-mail de teste enviado para ${usuario.email}`,
      resend_id: data?.id,
      diagnostico,
    });
  } catch (err) {
    return NextResponse.json({
      ok: false,
      etapa: "exceção",
      mensagem: err instanceof Error ? err.message : "Erro desconhecido",
      diagnostico,
    });
  }
}
