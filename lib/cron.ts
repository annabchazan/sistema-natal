import type { NextRequest } from "next/server";
import { textosIguais } from "@/lib/seguranca";

// Vercel injeta o CRON_SECRET automaticamente no header Authorization; em testes manuais, passe Bearer <CRON_SECRET>.
// Sem CRON_SECRET configurado, nega tudo (falha fechada).
export function cronAutorizado(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = req.headers.get("authorization") ?? "";
  return textosIguais(header, `Bearer ${secret}`);
}
