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
import CrachasIndex from "../components/admin/Cracha";
import DashboardMetricas from "../components/admin/DashboardMetricas";
import AdminMobileNav from "../components/admin/AdminMobileNav";
import {
  adminPodeCriarOuExcluir,
  adminPodeGerenciarPermissoes,
  requireAdminAccess,
  type AdminRole,
} from "@/lib/auth";
import type { TagRow } from "@/app/actions/tags";
import type { PontoEntregaRow } from "@/app/actions/pontosEntrega";
import type { RowDataPacket } from "mysql2/promise";

interface AdminProps {
  searchParams: Promise<{ tab?: string }>;
}

interface CartinhaAdminRow extends RowDataPacket {
  id: number;
  nome_crianca: string;
  idade: number;
  texto_cartinha: string;
  presente_pedido: string;
  instituicao_id: number;
  tag_id: number | null;
  numero_sequencial: number;
  foto_cartinha: string | null;
  data_limite_entrega: string | null;
  status: string;
  data_apadrinamento: string | null;
  apadrinhado_por_usuario_id: number | null;
  necessidade_especial: boolean;
  observacao_especial: string | null;
  nome_instituicao: string;
}

interface InstituicaoRow extends RowDataPacket {
  id: number;
  nome_instituicao: string;
  contato: string;
  responsavel: string;
  quantidade_vagas: number;
}

interface UsuarioAdminRow extends RowDataPacket {
  id: number;
  nome: string;
  telefone: string;
  email: string;
  tipo: "admin" | "padrinho";
  admin_role: AdminRole | null;
}

interface StatusCountRow extends RowDataPacket {
  status: string;
  total: number;
}

interface TotalPadrinhosRow extends RowDataPacket {
  totalPadrinhos: number;
}

interface TotalVencidasRow extends RowDataPacket {
  totalVencidas: number;
}

export default async function AdminPage({ searchParams }: AdminProps) {
  const usuario = await requireAdminAccess();
  const canManage = adminPodeCriarOuExcluir(usuario);
  const canManageUsers = adminPodeGerenciarPermissoes(usuario);
  const { tab } = await searchParams;
  const abaAtiva = tab || "geral";

  const [
    [cartinhas],
    [instituicoes],
    [pontosEntrega],
    [tags],
    [usuarios],
    [statusRows],
    [[{ totalPadrinhos }]],
    [[{ totalVencidas }]],
  ] = await Promise.all([
    db.query<CartinhaAdminRow[]>(`
      SELECT cartinhas.*, instituicoes.nome_instituicao
      FROM cartinhas
      INNER JOIN instituicoes ON cartinhas.instituicao_id = instituicoes.id
      ORDER BY cartinhas.id DESC
    `),
    db.query<InstituicaoRow[]>("SELECT id, nome_instituicao, contato, responsavel, quantidade_vagas FROM instituicoes"),
    db.query<PontoEntregaRow[]>("SELECT id, nome_local, endereco, horario FROM pontos_entrega"),
    db.query<TagRow[]>("SELECT id, nome FROM tags"),
    db.query<UsuarioAdminRow[]>("SELECT id, nome, telefone, email, tipo, admin_role FROM usuarios ORDER BY nome ASC"),
    db.query<StatusCountRow[]>("SELECT status, COUNT(*) as total FROM cartinhas GROUP BY status"),
    db.query<TotalPadrinhosRow[]>("SELECT COUNT(*) as totalPadrinhos FROM usuarios WHERE tipo = 'padrinho'"),
    db.query<TotalVencidasRow[]>(`SELECT COUNT(*) as totalVencidas FROM cartinhas
              WHERE data_limite_entrega < CURDATE()
                AND status NOT IN ('entregue', 'cancelada')`),
  ]);

  const porStatus: Record<string, number> = {};
  for (const row of statusRows) {
    porStatus[row.status] = Number(row.total);
  }

  const abas = [
    { id: "geral",        label: "Visão geral" },
    { id: "cartinhas",    label: "Cartinhas" },
    { id: "instituicoes", label: "Instituições" },
    { id: "tags",         label: "Tags" },
    { id: "pontos",       label: "Pontos de Entrega" },
    { id: "crachas",      label: "Crachás" },
    { id: "exportar",     label: "Exportar" },
    ...(canManageUsers
      ? [{ id: "usuarios", label: "Usuários" }]
      : []),
  ];
  const abasPermitidas = new Set(abas.map((aba) => aba.id));

  if (!abasPermitidas.has(abaAtiva)) {
    redirect("/admin");
  }

  return (
    <div className="min-h-full bg-cream-deep flex">
      <aside className="w-64 bg-white border-r border-stone-200 hidden md:flex flex-col">
        <div className="p-6 flex items-center gap-3">
          <span className="w-[6px] h-5 bg-brand flex-shrink-0" />
          <div>
            <h2 className="text-base font-bold text-ink">Natal Solidário</h2>
            <p className="text-xs text-stone-400">Painel de controle</p>
          </div>
        </div>
        <nav className="flex-1 px-4 space-y-1">
          {abas.map((aba) => (
            <Link
              key={aba.id}
              href={`/admin?tab=${aba.id}`}
              className={`flex items-center gap-3 p-3 rounded text-sm transition-colors ${
                abaAtiva === aba.id
                  ? "bg-brand/10 text-brand-dark font-semibold"
                  : "text-stone-500 hover:bg-cream-deep"
              }`}
            >
              {aba.label}
            </Link>
          ))}
        </nav>
      </aside>

      <main className="flex-1 p-8">
        <AdminMobileNav abas={abas} abaAtiva={abaAtiva} />

        <header className="mb-8 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-ink">
                {abas.find((a) => a.id === abaAtiva)?.label}
              </h1>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-brand text-white text-[11px] font-bold shrink-0">
                  {usuario.nome.charAt(0).toUpperCase()}
                </span>
                <p className="text-sm text-stone-400">
                  Logado como {usuario.nome} ({
                    usuario.admin_role === "master"
                      ? "Super Adm"
                      : usuario.admin_role === "full"
                        ? "Gerente"
                        : "Editor"
                  })
                </p>
              </div>
            </div>
          </div>

          {!canManage && (
            <div className="rounded border border-brand/30 bg-brand/5 px-4 py-3 text-sm text-brand-dark">
              Seu perfil pode editar registros existentes, mas não pode cadastrar
              nem remover itens.
            </div>
          )}
        </header>

        {abaAtiva === "geral" && (
          <DashboardMetricas
            porStatus={porStatus}
            totalPadrinhos={Number(totalPadrinhos)}
            totalVencidas={Number(totalVencidas)}
          />
        )}

        {abaAtiva !== "geral" && (
          <section className="bg-white rounded-md border border-stone-200 p-6">
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

            {abaAtiva === "crachas" && (
              <CrachasIndex cartinhas={cartinhas} instituicoes={instituicoes} />
            )}

            {abaAtiva === "exportar" && <ExportarIndex />}

            {abaAtiva === "usuarios" && canManageUsers && (
              <div className="space-y-8">
                <div className="rounded border border-stone-200 bg-cream-deep p-4 text-sm text-stone-600">
                  <p className="font-semibold text-ink mb-2">O que cada nível pode fazer</p>
                  <ul className="space-y-1">
                    <li><span className="font-semibold">Editor</span> — edita cartinhas, instituições, tags e pontos de entrega já cadastrados. Não pode criar, excluir, nem ver esta aba.</li>
                    <li><span className="font-semibold">Gerente</span> — além de editar, pode criar e excluir cartinhas, instituições, tags e pontos de entrega. Não vê esta aba.</li>
                    <li><span className="font-semibold">Super Adm</span> — único que acessa esta aba: cadastra admins e muda o nível de qualquer um. Também pode tudo que o Gerente faz.</li>
                  </ul>
                </div>
                <FormularioUsuarioAdmin />
                <TabelaUsuariosAdmin dados={usuarios} />
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
