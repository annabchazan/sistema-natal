import FormularioCartinha from "@/app/components/admin/Cartinha/FormularioCartinha";
import { adminPodeCriarOuExcluir, requireAdminAccess } from "@/lib/auth";
import db from "@/lib/db";
import { RowDataPacket } from "mysql2/promise";
import { redirect } from "next/navigation";

export type Instituicao = RowDataPacket & {
  id: number;
  nome_instituicao: string;
};
export type Tag = RowDataPacket & {
  id: number;
  nome: string;
};

export default async function PaginaCadastroCartinha() {
  const usuario = await requireAdminAccess();
  if (!adminPodeCriarOuExcluir(usuario)) {
    redirect("/admin");
  }

  const [instituicoes] = await db.query<Instituicao[]>(
    "SELECT id, nome_instituicao FROM instituicoes",
  );
  const [tags] = await db.query<Tag[]>("SELECT id, nome FROM tags");

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <FormularioCartinha instituicoes={instituicoes} tags={tags} />
      </div>
    </div>
  );
}
