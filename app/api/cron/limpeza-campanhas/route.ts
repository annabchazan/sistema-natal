import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { cronAutorizado } from "@/lib/cron";
import { limparContadoresAntigos } from "@/lib/rateLimit";
import { apagarImagens } from "@/lib/cloudinary";
import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";


interface CampanhaParaLimpar extends RowDataPacket {
  id: number;
  ano: number;
}

interface FotoCartinhaRow extends RowDataPacket {
  foto_cartinha: string;
}

interface ContagemRow extends RowDataPacket {
  total: number;
}

// Retenção combinada com a cliente (LGPD, 2026-07-20): mantém o histórico de
// apadrinhamento por 6 meses após o fim da campanha, depois apaga. Na limpeza de
// cada campanha somem, nesta ordem: as fotos das cartinhas no Cloudinary, as
// desistências ligadas a essas cartinhas (guardam nome e e-mail do padrinho) e as
// cartinhas em si. O resumo agregado em campanhas (totais, datas) fica pra sempre,
// e lembretes_enviados sobrevive por não guardar dado pessoal (ver migration_v12.sql).
//
// As desistências saem ANTES das cartinhas porque não têm campanha_id: o único elo
// com a campanha é cartinha_id. Apagar nessa ordem funciona seja qual for a FK dessa
// coluna (sem FK, CASCADE ou RESTRICT).
//
// Simulação: GET /api/cron/limpeza-campanhas?dry=1 só conta o que seria removido,
// sem apagar nada (nem imagens, nem linhas, nem marcar a campanha).
export async function GET(req: NextRequest) {
  if (!cronAutorizado(req)) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const simulacao = req.nextUrl.searchParams.get("dry") === "1";

  try {
    const [pendentes] = await db.query<CampanhaParaLimpar[]>(
      `SELECT id, ano FROM campanhas
       WHERE data_encerramento IS NOT NULL
         AND data_encerramento < DATE_SUB(NOW(), INTERVAL 6 MONTH)
         AND dados_removidos_em IS NULL`,
    );

    let cartinhasRemovidas = 0;
    let desistenciasRemovidas = 0;
    let imagensApagadas = 0;
    let imagensComFalha = 0;

    // Aproveita o cron diário pra limpar contadores de rate limit vencidos.
    if (!simulacao) {
      await limparContadoresAntigos().catch((err) => console.error("Falha ao limpar rate_limit:", err));
    }

    for (const campanha of pendentes) {
      // Imagens primeiro, enquanto as URLs ainda existem no banco: depois do DELETE elas
      // se perderiam e as fotos ficariam órfãs no Cloudinary. Falha aqui só é logada
      // (apagarImagens nunca lança) e não impede a limpeza dos dados.
      const [fotos] = await db.query<FotoCartinhaRow[]>(
        "SELECT foto_cartinha FROM cartinhas WHERE campanha_id = ? AND foto_cartinha IS NOT NULL",
        [campanha.id],
      );

      if (simulacao) {
        imagensApagadas += fotos.length;
        const [[desistencias]] = await db.query<ContagemRow[]>(
          `SELECT COUNT(*) AS total FROM desistencias
           WHERE cartinha_id IN (SELECT id FROM cartinhas WHERE campanha_id = ?)`,
          [campanha.id],
        );
        desistenciasRemovidas += Number(desistencias?.total ?? 0);
        const [[cartinhas]] = await db.query<ContagemRow[]>(
          "SELECT COUNT(*) AS total FROM cartinhas WHERE campanha_id = ?",
          [campanha.id],
        );
        cartinhasRemovidas += Number(cartinhas?.total ?? 0);
        continue;
      }

      const imagens = await apagarImagens(fotos.map((f) => f.foto_cartinha));
      imagensApagadas += imagens.apagadas;
      imagensComFalha += imagens.falhas;

      // Antes das cartinhas: depois delas, o vínculo com a campanha já não existe.
      const [resDesistencias] = await db.query<ResultSetHeader>(
        `DELETE FROM desistencias
         WHERE cartinha_id IN (SELECT id FROM cartinhas WHERE campanha_id = ?)`,
        [campanha.id],
      );
      desistenciasRemovidas += resDesistencias.affectedRows;

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
      `[cron/limpeza-campanhas]${simulacao ? " SIMULACAO" : ""} campanhas=${pendentes.length} cartinhas_removidas=${cartinhasRemovidas} desistencias_removidas=${desistenciasRemovidas} imagens_apagadas=${imagensApagadas} imagens_com_falha=${imagensComFalha}`,
    );

    return NextResponse.json({
      ok: true,
      ...(simulacao ? { simulacao: true } : {}),
      campanhasLimpas: pendentes.map((c) => c.ano),
      cartinhasRemovidas,
      desistenciasRemovidas,
      imagensApagadas,
      imagensComFalha,
    });
  } catch (err) {
    console.error("[cron/limpeza-campanhas] erro:", err);
    return new NextResponse("Erro interno", { status: 500 });
  }
}
