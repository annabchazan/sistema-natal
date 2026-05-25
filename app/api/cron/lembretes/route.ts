import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { enviarLembreteEntrega } from "@/lib/email";

// Vercel injeta o CRON_SECRET automaticamente no header Authorization.
// Em chamadas manuais/testes, passe: Authorization: Bearer <CRON_SECRET>
function autorizacaoValida(req: NextRequest): boolean {
  const header = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return header === `Bearer ${secret}`;
}

interface CartinhaLembrete {
  id: number;
  nome_crianca: string;
  presente_pedido: string;
  data_limite_entrega: string | null;
  numero_sequencial: number | null;
  padrinho_nome: string;
  padrinho_email: string;
}

export async function GET(req: NextRequest) {
  if (!autorizacaoValida(req)) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    // Cartinhas com prazo em exatamente 10 dias, sem lembrete '10d' enviado
    const [em10dias]: any = await db.query(`
      SELECT
        c.id, c.nome_crianca, c.presente_pedido,
        c.data_limite_entrega, c.numero_sequencial,
        u.nome  AS padrinho_nome,
        u.email AS padrinho_email
      FROM cartinhas c
      JOIN  usuarios u           ON c.apadrinhado_por_usuario_id = u.id
      LEFT JOIN lembretes_enviados le
             ON le.cartinha_id = c.id AND le.tipo = '10d'
      WHERE DATEDIFF(c.data_limite_entrega, CURDATE()) = 10
        AND c.status NOT IN ('entregue', 'cancelada')
        AND le.id IS NULL
    `);

    // Cartinhas com prazo vencido (qualquer dia passado), sem lembrete 'vencido' enviado
    const [vencidas]: any = await db.query(`
      SELECT
        c.id, c.nome_crianca, c.presente_pedido,
        c.data_limite_entrega, c.numero_sequencial,
        u.nome  AS padrinho_nome,
        u.email AS padrinho_email
      FROM cartinhas c
      JOIN  usuarios u           ON c.apadrinhado_por_usuario_id = u.id
      LEFT JOIN lembretes_enviados le
             ON le.cartinha_id = c.id AND le.tipo = 'vencido'
      WHERE c.data_limite_entrega < CURDATE()
        AND c.status NOT IN ('entregue', 'cancelada')
        AND le.id IS NULL
    `);

    const resultados = { enviados: 0, falhas: 0 };

    async function processarLote(
      cartinhas: CartinhaLembrete[],
      tipo: "10d" | "vencido",
    ) {
      for (const c of cartinhas) {
        const { ok } = await enviarLembreteEntrega({
          nomePadrinho:     c.padrinho_nome,
          emailPadrinho:    c.padrinho_email,
          nomeCrianca:      c.nome_crianca,
          presentePedido:   c.presente_pedido,
          dataLimite:       c.data_limite_entrega,
          numeroSequencial: c.numero_sequencial,
          tipo,
        });

        if (ok) {
          // INSERT IGNORE garante idempotência caso o cron rode duas vezes no mesmo dia
          await db.query(
            "INSERT IGNORE INTO lembretes_enviados (cartinha_id, tipo) VALUES (?, ?)",
            [c.id, tipo],
          );
          resultados.enviados++;
        } else {
          resultados.falhas++;
        }
      }
    }

    await processarLote(em10dias as CartinhaLembrete[], "10d");
    await processarLote(vencidas as CartinhaLembrete[], "vencido");

    console.log(`[cron/lembretes] enviados=${resultados.enviados} falhas=${resultados.falhas}`);

    return NextResponse.json({
      ok: true,
      em10dias: (em10dias as any[]).length,
      vencidas: (vencidas as any[]).length,
      ...resultados,
    });
  } catch (err) {
    console.error("[cron/lembretes] erro:", err);
    return new NextResponse("Erro interno", { status: 500 });
  }
}
