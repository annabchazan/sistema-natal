"use server";

import db from "@/lib/db";
import { revalidatePath } from "next/cache";
import { validarPermissaoAdmin } from "@/lib/auth";
import type { RowDataPacket } from "mysql2/promise";

export interface TagsState {
  success: boolean;
  message: string;
}

export interface TagRow extends RowDataPacket {
  id: number;
  nome: string;
}

export async function salvarTag(
  prevstate: TagsState | null,
  formData: FormData,
): Promise<TagsState> {
  const id = String(formData.get("id") ?? "").trim();
  const nome = String(formData.get("nome") ?? "").trim();

  const permissao = await validarPermissaoAdmin(id ? "edit" : "manage");
  if (!permissao.ok) {
    return { success: false, message: permissao.message };
  }

  if (!nome) {
    return { success: false, message: "Informe o nome da tag." };
  }

  try {
    if (id) {
      await db.query("UPDATE tags SET nome = ? WHERE id = ?", [
        nome,
        Number(id),
      ]);
    } else {
      await db.query("INSERT INTO tags(nome) VALUES (?)", [nome]);
    }

    revalidatePath("/admin");
    revalidatePath("/");

    return {
      success: true,
      message: id ? "Tag atualizada com sucesso!" : "Tag cadastrada com sucesso!",
    };
  } catch (err) {
    console.error("Erro ao salvar tag:", err);
    return {
      success: false,
      message:
        "Erro ao salvar no banco. Verifique se os campos estao corretos.",
    };
  }
}

export async function excluirTag(id: number): Promise<TagsState> {
  const permissao = await validarPermissaoAdmin("manage");
  if (!permissao.ok) {
    return { success: false, message: permissao.message };
  }

  try {
    await db.query("DELETE FROM tags WHERE id = ?", [id]);
    revalidatePath("/admin");
    revalidatePath("/");
    return { success: true, message: "Tag removida com sucesso!" };
  } catch (err) {
    console.error("Erro ao excluir tag:", err);
    return {
      success: false,
      message: "Nao foi possivel excluir a tag. Verifique se ela esta em uso.",
    };
  }
}

export async function listarTags(): Promise<TagRow[]> {
  try {
    const [tags] = await db.query<TagRow[]>(
      "SELECT id, nome FROM tags ORDER BY nome ASC",
    );
    return tags;
  } catch (err) {
    console.error("Erro ao listar tags:", err);
    return [];
  }
}
