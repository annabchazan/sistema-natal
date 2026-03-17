"use server";
import db from "@/lib/db";
import { revalidatePath } from "next/cache";

export interface TagsState {
  success: boolean;
  message: string;
}

export async function cadastrarTags(
  prevstate: TagsState | null,
  formData: FormData,
): Promise<TagsState> {
  const nome = formData.get("nome") as string;

  try {
    await db.query("INSERT INTO tags(nome) VALUES (?)", [nome]);

    revalidatePath("/admin/tags");
    revalidatePath("/");

    return { success: true, message: "Tag cadastrada com sucesso!" };
  } catch (err) {
    console.error("Erro ao cadastrar tag:", err);
    return {
      success: false,
      message:
        "Erro ao salvar no banco. Verifique se os campos estão corretos.",
    };
  }
}
