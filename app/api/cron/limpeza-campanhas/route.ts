import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";

// Vercel injeta o CRON_SECRET automaticamente no header Authorization; em testes manuais, passe Bearer <CRON_SECRET>.
function autorizacaoValida(req: NextRequest): boolean {
  const header = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return header === `Bearer ${secret}`;
}

interface CampanhaParaLimpar extends RowDataPacket {
  id: number;
  ano: number;
}

// Retenção combinada com a cliente (LGPD, 2026-07-20): mantém o histórico de
// apadrinhamento por 6 meses após o fim da campanha, depois apaga. As
// cartinhas em si somem; o resumo agregado em campanhas (totais, datas) fica
// pra sempre, e desistencias/lembretes_enviados sobrevivem por já guardarem
// snapshot ou não precisarem do vínculo (ver migration_v12.sql).
export async function GET(req: NextRequest) {
  if (!autorizacaoValida(req)) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const [pendentes] = await db.query<CampanhaParaLimpar[]>(
      `SELECT id, ano FROM campanhas
       WHERE data_encerramento IS NOT NULL
         AND data_encerramento < DATE_SUB(NOW(), INTERVAL 6 MONTH)
         AND dados_removidos_em IS NULL`,
    );

    let cartinhasRemovidas = 0;

    for (const campanha of pendentes) {
      const [resultado] = await db.query<ResultSetHeader>(
        "DELETE FROM cartinhas WHERE campanha_id = ?",
        [campanha.id],
      );
      cartinhasRemovidas += resultado.affectedRows;

      await db.query(
        "UPDATE campanhas SET dados_removidos_em = NOW() WHERE id = ?",
        [campanha.id],
      );
    }

    console.log(
      `[cron/limpeza-campanhas] campanhas=${pendentes.length} cartinhas_removidas=${cartinhasRemovidas}`,
    );

    return NextResponse.json({
      ok: true,
      campanhasLimpas: pendentes.map((c) => c.ano),
      cartinhasRemovidas,
    });
  } catch (err) {
    console.error("[cron/limpeza-campanhas] erro:", err);
    return new NextResponse("Erro interno", { status: 500 });
  }
}
