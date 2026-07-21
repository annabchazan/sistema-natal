import db from "@/lib/db";
import { requireAdminAccess } from "@/lib/auth";
import type { RowDataPacket } from "mysql2/promise";
import BotaoImprimir from "./BotaoImprimir";

interface CrachaPageProps {
  searchParams: Promise<{ ids?: string }>;
}

interface CrachaRow extends RowDataPacket {
  id: number;
  nome_crianca: string;
  idade: number;
  numero_sequencial: number | null;
  necessidade_especial: boolean;
  observacao_especial: string | null;
  nome_instituicao: string;
}

export default async function ImprimirCrachasPage({ searchParams }: CrachaPageProps) {
  await requireAdminAccess();

  const { ids: idsRaw } = await searchParams;
  const ids = (idsRaw ?? "")
    .split(",")
    .map((v) => Number(v))
    .filter((v) => Number.isInteger(v) && v > 0);

  if (ids.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <p className="text-gray-500">Nenhuma cartinha selecionada.</p>
      </div>
    );
  }

  const placeholders = ids.map(() => "?").join(",");
  const [cartinhas] = await db.query<CrachaRow[]>(
    `SELECT c.id, c.nome_crianca, c.idade, c.numero_sequencial,
            c.necessidade_especial, c.observacao_especial,
            i.nome_instituicao
     FROM cartinhas c
     INNER JOIN instituicoes i ON c.instituicao_id = i.id
     WHERE c.id IN (${placeholders})
     ORDER BY c.numero_sequencial ASC`,
    ids,
  );

  return (
    <div className="min-h-screen bg-gray-100 p-8 print:bg-white print:p-0">
      <BotaoImprimir />

      <style>{`
        @page { size: A4; margin: 10mm; }
        .folha-crachas {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8mm;
          page-break-after: always;
        }
        .folha-crachas:last-child { page-break-after: auto; }
        .cracha {
          border: 2px solid #d1d5db;
          border-radius: 10px;
          padding: 14px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          min-height: 55mm;
          break-inside: avoid;
        }
        .cracha-especial { border-color: #a3e635; background: #f7ffe0; }
        .cracha-verso { border-style: dashed; justify-content: center; }
      `}</style>

      <div className="max-w-4xl mx-auto print:max-w-none space-y-8 print:space-y-0">
        {agruparEmFolhas(cartinhas).map((folha, i) => (
          <div key={i} className="folha-crachas">
            {folha.map((item) =>
              item.tipo === "frente" ? (
                <div
                  key={`frente-${item.cartinha.id}`}
                  className={`cracha ${item.cartinha.necessidade_especial ? "cracha-especial" : ""}`}
                >
                  <div className="flex items-center gap-2">
                    <img
                      src="/logo-sempre-crianca.png"
                      alt="Sempre Criança"
                      className="h-10 w-10 object-contain"
                    />
                    <span className="text-xs font-semibold text-gray-500">
                      Sempre Criança
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-center text-gray-700">
                    {item.cartinha.nome_instituicao}
                  </p>
                  <p className="text-lg font-bold text-center flex-1 flex items-center justify-center">
                    {item.cartinha.nome_crianca}
                  </p>
                  <div className="flex justify-between text-sm font-semibold">
                    <span>
                      Nº.: {item.cartinha.numero_sequencial ?? item.cartinha.id}
                    </span>
                    <span>Idade: {item.cartinha.idade} Anos</span>
                  </div>
                  <p className="text-xs text-center font-semibold text-gray-500">
                    {item.cartinha.necessidade_especial
                      ? "Crachá criança — ESPECIAL (imprimir em neon)"
                      : "Crachá criança"}
                  </p>
                </div>
              ) : (
                <div key={`verso-${item.cartinha.id}`} className="cracha cracha-verso cracha-especial">
                  <p className="text-xs font-bold text-center text-gray-600 uppercase">
                    Observação — {item.cartinha.nome_crianca}
                  </p>
                  <p className="text-sm text-center text-gray-800">
                    {item.cartinha.observacao_especial || "—"}
                  </p>
                </div>
              ),
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

type ItemFolha =
  | { tipo: "frente"; cartinha: CrachaRow }
  | { tipo: "verso"; cartinha: CrachaRow };

function agruparEmFolhas(cartinhas: CrachaRow[]): ItemFolha[][] {
  const itens: ItemFolha[] = [];
  for (const c of cartinhas) {
    itens.push({ tipo: "frente", cartinha: c });
    if (c.necessidade_especial) {
      itens.push({ tipo: "verso", cartinha: c });
    }
  }

  const folhas: ItemFolha[][] = [];
  for (let i = 0; i < itens.length; i += 4) {
    folhas.push(itens.slice(i, i + 4));
  }
  return folhas;
}
