import db from "@/lib/db";
import Link from "next/link";
import { redirect } from "next/navigation";
import CartinhasIndex from "../components/admin/Cartinha";
import InstituicoesIndex from "../components/admin/Instituicao";
import TagsIndex from "../components/admin/Tag";
import PontosEntregaIndex from "../components/admin/PontoEntrega";
import FormularioUsuarioAdmin from "../components/admin/Usuario/FormularioUsuarioAdmin";
import TabelaUsuariosAdmin from "../components/admin/Usuario/TabelaUsuariosAdmin";
import ExportarIndex from "../components/admin/Exportar";
import DashboardMetricas from "../components/admin/DashboardMetricas";
import { adminPodeCriarOuExcluir, requireAdminAccess } from "@/lib/auth";

interface AdminProps {
  searchParams: Promise<{ tab?: string }>;
}

export default async function AdminPage({ searchParams }: AdminProps) {
  const usuario = await requireAdminAccess();
  const canManage = adminPodeCriarOuExcluir(usuario);
  const { tab } = await searchParams;
  const abaAtiva = tab || "cartinhas";

  const [
    [cartinhas],
    [instituicoes],
    [pontosEntrega],
    [tags],
    [usuarios],
    [statusRows],
    [[{ totalPadrinhos }]],
    [[{ totalVencidas }]],
  ]: any = await Promise.all([
    db.query(`
      SELECT cartinhas.*, instituicoes.nome_instituicao
      FROM cartinhas
      INNER JOIN instituicoes ON cartinhas.instituicao_id = instituicoes.id
      ORDER BY cartinhas.id DESC
    `),
    db.query("SELECT id, nome_instituicao, contato, responsavel, quantidade_vagas FROM instituicoes"),
    db.query("SELECT id, nome_local, endereco, horario FROM pontos_entrega"),
    db.query("SELECT id, nome FROM tags"),
    db.query("SELECT id, nome, telefone, email, tipo, admin_role FROM usuarios ORDER BY nome ASC"),
    db.query("SELECT status, COUNT(*) as total FROM cartinhas GROUP BY status"),
    db.query("SELECT COUNT(*) as totalPadrinhos FROM usuarios WHERE tipo = 'padrinho'"),
    db.query(`SELECT COUNT(*) as totalVencidas FROM cartinhas
              WHERE data_limite_entrega < CURDATE()
                AND status NOT IN ('entregue', 'cancelada')`),
  ]);

  const porStatus: Record<string, number> = {};
  for (const row of statusRows) {
    porStatus[row.status] = Number(row.total);
  }

  const abas = [
    { id: "cartinhas",   label: "Cartinhas",        icon: "Cartinhas" },
    { id: "instituicoes", label: "Instituições",     icon: "Instituições" },
    { id: "tags",        label: "Tags",              icon: "Tags" },
    { id: "pontos",      label: "Pontos de Entrega", icon: "Pontos" },
    { id: "exportar",    label: "Exportar",          icon: "Exportar" },
    ...(canManage
      ? [{ id: "usuarios", label: "Usuários", icon: "Usuários" }]
      : []),
  ];
  const abasPermitidas = new Set(abas.map((aba) => aba.id));

  if (!abasPermitidas.has(abaAtiva)) {
    redirect("/admin");
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
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
              <span className="text-xs uppercase tracking-wide">{aba.icon}</span>
              {aba.label}
            </Link>
          ))}
        </nav>
      </aside>

      <main className="flex-1 p-8">
        <DashboardMetricas
          porStatus={porStatus}
          totalPadrinhos={Number(totalPadrinhos)}
          totalVencidas={Number(totalVencidas)}
        />

        <header className="mb-8 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                {abas.find((a) => a.id === abaAtiva)?.label}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Logado como {usuario.nome} ({canManage ? "admin completo" : "admin editor"})
              </p>
            </div>
          </div>

          {!canManage && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Seu perfil pode editar registros existentes, mas não pode cadastrar
              nem remover itens.
            </div>
          )}
        </header>

        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {abaAtiva === "cartinhas" && (
            <CartinhasIndex
              cartinhas={cartinhas}
              instituicoes={instituicoes}
              tags={tags}
              canManage={canManage}
            />
          )}

          {abaAtiva === "instituicoes" && (
            <InstituicoesIndex
              instituicoes={instituicoes}
              canManage={canManage}
            />
          )}

          {abaAtiva === "tags" && (
            <TagsIndex tags={tags} canManage={canManage} />
          )}

          {abaAtiva === "pontos" && (
            <PontosEntregaIndex
              pontosEntrega={pontosEntrega}
              canManage={canManage}
            />
          )}

          {abaAtiva === "exportar" && <ExportarIndex />}

          {abaAtiva === "usuarios" && canManage && (
            <div className="space-y-8">
              <FormularioUsuarioAdmin />
              <TabelaUsuariosAdmin dados={usuarios} />
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
