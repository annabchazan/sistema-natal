"use server";

import db from "@/lib/db";
import { revalidatePath } from "next/cache";
import { validarPermissaoAdmin } from "@/lib/auth";

export interface InstituicaoState {
  success: boolean;
  message: string;
}

export async function salvarInstituicao(
  prevState: InstituicaoState | null,
  formData: FormData,
): Promise<InstituicaoState> {
  const id = String(formData.get("id") ?? "").trim();
  const nome = String(formData.get("nome_instituicao") ?? "").trim();
  const responsavel = String(formData.get("responsavel") ?? "").trim();
  const contato = String(formData.get("contato") ?? "").trim();
  const quantidadeVagas = Number(formData.get("quantidade_vagas") ?? 0);

  const permissao = await validarPermissaoAdmin(id ? "edit" : "manage");
  if (!permissao.ok) {
    return { success: false, message: permissao.message };
  }

  if (!nome || !responsavel || !contato || !Number.isFinite(quantidadeVagas)) {
    return {
      success: false,
      message: "Preencha todos os campos da instituicao corretamente.",
    };
  }

  try {
    if (id) {
      await db.query(
        "UPDATE instituicoes SET nome_instituicao = ?, responsavel = ?, contato = ?, quantidade_vagas = ? WHERE id = ?",
        [nome, responsavel, contato, quantidadeVagas, Number(id)],
      );
    } else {
      await db.query(
        "INSERT INTO instituicoes(nome_instituicao, responsavel, contato, quantidade_vagas) VALUES (?, ?, ?, ?)",
        [nome, responsavel, contato, quantidadeVagas],
      );
    }

    revalidatePath("/admin");
    revalidatePath("/admin/instituicoes");

    return {
      success: true,
      message: id
        ? "Instituicao atualizada com sucesso!"
        : "Instituicao cadastrada com sucesso!",
    };
  } catch (err) {
    console.error("Erro ao salvar instituicao:", err);
    return {
      success: false,
      message: "Erro ao conectar com o banco de dados.",
    };
  }
}

export async function excluirInstituicao(id: number): Promise<InstituicaoState> {
  const permissao = await validarPermissaoAdmin("manage");
  if (!permissao.ok) {
    return { success: false, message: permissao.message };
  }

  try {
    await db.query("DELETE FROM instituicoes WHERE id = ?", [id]);
    revalidatePath("/admin");
    revalidatePath("/admin/instituicoes");
    return { success: true, message: "Instituicao removida com sucesso!" };
  } catch (err) {
    console.error("Erro ao excluir instituicao:", err);
    return {
      success: false,
      message:
        "Nao foi possivel excluir a instituicao. Verifique se existem cartinhas vinculadas.",
    };
  }
}
