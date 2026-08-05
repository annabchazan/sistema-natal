"use server";

import db from "@/lib/db";
import { revalidatePath } from "next/cache";
import { validarPermissaoAdmin } from "@/lib/auth";
import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";

export interface CampanhaState {
  success: boolean;
  message: string;
}

export interface CampanhaRow extends RowDataPacket {
  id: number;
  ano: number;
  data_encerramento: string | null;
  total_cartinhas: number | null;
  total_apadrinhadas: number | null;
  total_entregues: number | null;
  total_instituicoes: number | null;
  criado_em: string;
}

interface CampanhaIdRow extends RowDataPacket {
  id: number;
}

interface AgregadosCampanhaRow extends RowDataPacket {
  total_cartinhas: number;
  total_apadrinhadas: number;
  total_entregues: number;
  total_instituicoes: number;
}

// Retorna o id da campanha ativa (data_encerramento IS NULL), criando uma
// pro ano corrente se nenhuma estiver ativa. Cartinhas novas devem sempre ser
// atribuídas à campanha retornada aqui.
export async function obterOuCriarCampanhaAtiva(): Promise<number> {
  const [ativas] = await db.query<CampanhaIdRow[]>(
    "SELECT id FROM campanhas WHERE data_encerramento IS NULL LIMIT 1",
  );
  if (ativas.length > 0) return ativas[0].id;

  const [resultado] = await db.query<ResultSetHeader>(
    "INSERT INTO campanhas (ano) VALUES (?)",
    [new Date().getFullYear()],
  );
  return resultado.insertId;
}

// --- LISTAR CAMPANHAS (aba "Campanhas" do admin) ---
export async function listarCampanhas(): Promise<CampanhaRow[]> {
  try {
    const [campanhas] = await db.query<CampanhaRow[]>(
      "SELECT * FROM campanhas ORDER BY ano DESC, id DESC",
    );
    return campanhas;
  } catch (err) {
    console.error("Erro ao listar campanhas:", err);
    return [];
  }
}

// --- ENCERRAR A CAMPANHA ATIVA ---
// Congela os totais da campanha atual e marca data_encerramento. A partir
// daí, cartinhas novas passam a cair numa campanha seguinte (criada sob
// demanda por obterOuCriarCampanhaAtiva) e a home pública para de listar as
// cartinhas da campanha encerrada.
export async function finalizarCampanha(): Promise<CampanhaState> {
  const permissao = await validarPermissaoAdmin("users");
  if (!permissao.ok) {
    return { success: false, message: permissao.message };
  }

  try {
    const [ativas] = await db.query<CampanhaIdRow[]>(
      "SELECT id FROM campanhas WHERE data_encerramento IS NULL LIMIT 1",
    );
    if (ativas.length === 0) {
      return { success: false, message: "Não há campanha ativa para encerrar." };
    }
    const campanhaId = ativas[0].id;

    const [linhasAgregados] = await db.query<AgregadosCampanhaRow[]>(
      `SELECT
         COUNT(*) AS total_cartinhas,
         SUM(CASE WHEN status IN ('apadrinhada','conferida','embrulhado','reapadrinhado','entregue') THEN 1 ELSE 0 END) AS total_apadrinhadas,
         SUM(CASE WHEN status = 'entregue' THEN 1 ELSE 0 END) AS total_entregues,
         COUNT(DISTINCT instituicao_id) AS total_instituicoes
       FROM cartinhas WHERE campanha_id = ?`,
      [campanhaId],
    );
    const agregados = linhasAgregados[0];

    await db.query(
      `UPDATE campanhas
       SET data_encerramento = NOW(),
           total_cartinhas = ?, total_apadrinhadas = ?, total_entregues = ?, total_instituicoes = ?
       WHERE id = ?`,
      [
        agregados.total_cartinhas,
        agregados.total_apadrinhadas ?? 0,
        agregados.total_entregues ?? 0,
        agregados.total_instituicoes,
        campanhaId,
      ],
    );

    revalidatePath("/admin");
    revalidatePath("/");

    return { success: true, message: "Campanha encerrada com sucesso!" };
  } catch (err) {
    console.error("Erro ao encerrar campanha:", err);
    return { success: false, message: "Erro ao encerrar campanha." };
  }
}
