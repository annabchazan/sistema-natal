import { headers } from "next/headers";
import db from "@/lib/db";
import type { RowDataPacket } from "mysql2/promise";

interface ContagemRow extends RowDataPacket {
  contagem: number;
}

// Na Vercel cada requisição pode cair numa instância diferente, então o contador
// fica no MySQL (tabela rate_limit, migration_v13.sql) e não em memória.
// Janela fixa: a contagem zera quando a janela expira.
export async function dentroDoLimite(
  chave: string,
  maximo: number,
  janelaSegundos: number,
): Promise<boolean> {
  try {
    const chaveCurta = chave.slice(0, 190);
    await db.query(
      `INSERT INTO rate_limit (chave, contagem, janela_inicio) VALUES (?, 1, NOW())
       ON DUPLICATE KEY UPDATE
         contagem = IF(janela_inicio < DATE_SUB(NOW(), INTERVAL ? SECOND), 1, contagem + 1),
         janela_inicio = IF(janela_inicio < DATE_SUB(NOW(), INTERVAL ? SECOND), NOW(), janela_inicio)`,
      [chaveCurta, janelaSegundos, janelaSegundos],
    );
    const [rows] = await db.query<ContagemRow[]>(
      "SELECT contagem FROM rate_limit WHERE chave = ? LIMIT 1",
      [chaveCurta],
    );
    return Number(rows?.[0]?.contagem ?? 1) <= maximo;
  } catch (err) {
    // Se o contador falhar (ex.: migration ainda não aplicada), não derruba o site.
    console.error("Falha no rate limit:", err);
    return true;
  }
}

// Na Vercel o x-forwarded-for é definido pela própria plataforma. Fora dela (dev)
// cai em "local", o que só agrupa as tentativas locais.
export async function ipDaRequisicao(): Promise<string> {
  try {
    const h = await headers();
    const encaminhado = h.get("x-forwarded-for")?.split(",")[0]?.trim();
    const ip = encaminhado || h.get("x-real-ip") || "local";
    return ip.slice(0, 64);
  } catch {
    return "local";
  }
}

// Limpeza barata de contadores antigos (chamada pelo cron diário).
export async function limparContadoresAntigos() {
  await db.query("DELETE FROM rate_limit WHERE janela_inicio < DATE_SUB(NOW(), INTERVAL 1 DAY)");
}
