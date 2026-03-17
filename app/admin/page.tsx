import db from "@/lib/db";
import Link from "next/link";
import FormularioTags from "./tags/page";
import FormularioPontoEntrega from "../components/admin/PontoEntrega/FormularioPontoEntrega";
import TabelaTags from "../components/admin/Tag/TabelaTags";
import TabelaPontosEntrega from "../components/admin/PontoEntrega/TabelaPontosEntrega";
import CartinhasIndex from "../components/admin/Cartinha";
import InstituicoesIndex from "../components/admin/Instituicao";

// Tipagem para os parâmetros da URL
interface AdminProps {
  searchParams: Promise<{ tab?: string }>;
}

export default async function AdminPage({ searchParams }: AdminProps) {
  const { tab } = await searchParams;
  const abaAtiva = tab || "cartinhas"; // Aba padrão
  const [cartinhas] = (await db.query(`
    SELECT 
      cartinhas.*, 
      instituicoes.nome_instituicao 
    FROM cartinhas
    INNER JOIN instituicoes ON cartinhas.instituicao_id = instituicoes.id
    ORDER BY cartinhas.id DESC
  `)) as [any[], any];

  // Buscamos também as instituições e tags para os selects dos formulários
  // Buscamos os dados aqui no SERVIDOR (Rápido e Seguro)
  const [instituicoes]: any = await db.query(
    "SELECT id, nome_instituicao, contato, responsavel FROM instituicoes",
  );
  const [pontosEntrega]: any = await db.query(
    "SELECT id, nome_local, endereco, horario FROM pontos_entrega",
  );
  const [tags]: any = await db.query("SELECT id, nome FROM tags");

  const abas = [
    { id: "cartinhas", label: "Cartinhas", icon: "📝" },
    { id: "instituicoes", label: "Instituições", icon: "🏠" },
    { id: "tags", label: "Tags", icon: "🏷️" },
    { id: "pontos", label: "Pontos de Entrega", icon: "🚚" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* SIDEBAR LATERAL (Visual de Dashboard Profissional) */}
      <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col">
        <div className="p-6">
          <h2 className="text-xl font-bold text-red-600">Natal Solidário</h2>
          <p className="text-xs text-gray-500">Painel de Controle</p>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          {abas.map((aba) => (
            <Link
              key={aba.id}
              href={`/admin?tab=${aba.id}`}
              className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                abaAtiva === aba.id
                  ? "bg-red-50 text-red-700 font-semibold"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <span>{aba.icon}</span>
              {aba.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="flex-1 p-8">
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800">
            {abas.find((a) => a.id === abaAtiva)?.label}
          </h1>
        </header>

        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {abaAtiva === "cartinhas" && (
            <CartinhasIndex
              cartinhas={cartinhas}
              instituicoes={instituicoes}
              tags={tags}
            />
          )}
          {abaAtiva === "instituicoes" && (
            <InstituicoesIndex instituicoes={instituicoes} />
          )}
          {abaAtiva === "tags" && (
            <div className="space-y-8">
              {/* Formulário de cadastro no topo */}
              <FormularioTags />

              <div className="bg-white rounded-lg shadow border border-gray-200">
                <div className="p-4 border-b">
                  <h2 className="font-bold text-gray-700">Tags Registadas</h2>
                </div>
                <TabelaTags dados={tags} />
              </div>
            </div>
          )}
          {abaAtiva === "pontos" && (
            <div className="space-y-8">
              {/* Formulário de cadastro no topo */}
              <FormularioPontoEntrega />

              <div className="bg-white rounded-lg shadow border border-gray-200">
                <div className="p-4 border-b">
                  <h2 className="font-bold text-gray-700">
                    Pontos de Entrega Registados
                  </h2>
                </div>
                <TabelaPontosEntrega dados={pontosEntrega} />
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
