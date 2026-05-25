import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { getUsuarioAutenticado, usuarioEhAdmin } from "@/lib/auth";

const STATUS_LABEL: Record<string, string> = {
  disponivel:    "Disponível",
  apadrinhada:   "Apadrinhada",
  conferida:     "Conferida",
  carente:       "Carente",
  embrulhado:    "Embrulhado",
  reapadrinhado: "Reapadrinhado",
  entregue:      "Entregue",
  cancelada:     "Cancelada",
};

const STATUS_VALIDOS = new Set(Object.keys(STATUS_LABEL));

function formatarData(valor: any): string {
  if (!valor) return "";
  return new Date(valor).toLocaleDateString("pt-BR");
}

function formatarDataHora(valor: any): string {
  if (!valor) return "";
  return new Date(valor).toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function celula(valor: any): string {
  if (valor === null || valor === undefined) return "";
  const str = String(valor);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function linha(campos: any[]): string {
  return campos.map(celula).join(",");
}

// Mapa de todas as colunas disponíveis:
// chave → { cabeçalho para o CSV, função que extrai o valor de uma linha do banco }
const COLUNA_MAP: Record<string, { header: string; valor: (row: any) => any }> = {
  numero:              { header: "Número",                valor: (r) => r.numero_sequencial ?? "" },
  nome_crianca:        { header: "Nome da Criança",        valor: (r) => r.nome_crianca },
  idade:               { header: "Idade",                  valor: (r) => r.idade },
  instituicao:         { header: "Instituição",            valor: (r) => r.nome_instituicao ?? "" },
  status:              { header: "Status",                 valor: (r) => STATUS_LABEL[r.status] ?? r.status },
  presente:            { header: "Presente Pedido",        valor: (r) => r.presente_pedido },
  prazo:               { header: "Prazo de Entrega",       valor: (r) => formatarData(r.data_limite_entrega) },
  data_apadrinhamento: { header: "Data de Apadrinhamento", valor: (r) => formatarDataHora(r.data_apadrinamento) },
  padrinho_nome:       { header: "Padrinho",               valor: (r) => r.padrinho_nome ?? "" },
  padrinho_telefone:   { header: "Telefone",               valor: (r) => r.padrinho_telefone ?? "" },
  padrinho_email:      { header: "E-mail",                 valor: (r) => r.padrinho_email ?? "" },
};

const TODAS_COLUNAS = Object.keys(COLUNA_MAP);

export async function GET(req: NextRequest) {
  const usuario = await getUsuarioAutenticado();
  if (!usuario || !usuarioEhAdmin(usuario)) {
    return new NextResponse("Acesso negado", { status: 403 });
  }

  const { searchParams } = req.nextUrl;

  // --- Filtro de status ---
  const statusParam = searchParams.get("status") ?? "";
  const statusFiltro = statusParam
    .split(",")
    .map((s) => s.trim())
    .filter((s) => STATUS_VALIDOS.has(s));
  const filtrarStatus = statusFiltro.length > 0 && statusFiltro.length < STATUS_VALIDOS.size;

  // --- Colunas selecionadas ---
  const colunasParam = searchParams.get("colunas") ?? "";
  const colunasSolicitadas = colunasParam
    .split(",")
    .map((c) => c.trim())
    .filter((c) => COLUNA_MAP[c]);
  const colunas = colunasSolicitadas.length > 0 ? colunasSolicitadas : TODAS_COLUNAS;

  try {
    let query = `
      SELECT
        c.numero_sequencial,
        c.nome_crianca,
        c.idade,
        i.nome_instituicao,
        c.status,
        c.presente_pedido,
        c.data_limite_entrega,
        c.data_apadrinamento,
        u.nome        AS padrinho_nome,
        u.telefone    AS padrinho_telefone,
        u.email       AS padrinho_email
      FROM cartinhas c
      LEFT JOIN instituicoes i ON c.instituicao_id = i.id
      LEFT JOIN usuarios u    ON c.apadrinhado_por_usuario_id = u.id
    `;

    const params: any[] = [];
    if (filtrarStatus) {
      const placeholders = statusFiltro.map(() => "?").join(",");
      query += ` WHERE c.status IN (${placeholders})`;
      params.push(...statusFiltro);
    }

    query += " ORDER BY c.numero_sequencial ASC, c.id ASC";

    const [rows]: any = await db.query(query, params);

    // Monta o CSV apenas com as colunas escolhidas
    const cabecalho = linha(colunas.map((k) => COLUNA_MAP[k].header));
    const linhasCSV = (rows as any[]).map((row) =>
      linha(colunas.map((k) => COLUNA_MAP[k].valor(row)))
    );

    // BOM UTF-8 garante que Excel abre acentos corretamente
    const csv = "\uFEFF" + [cabecalho, ...linhasCSV].join("\r\n");
    const hoje = new Date().toISOString().slice(0, 10);

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="cartinhas-natal-${hoje}.csv"`,
      },
    });
  } catch (err) {
    console.error("Erro ao exportar CSV:", err);
    return new NextResponse("Erro ao gerar exportação", { status: 500 });
  }
}
