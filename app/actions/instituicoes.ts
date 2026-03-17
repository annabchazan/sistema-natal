"use server";
import db from "@/lib/db";
import { revalidatePath } from "next/cache";
export interface InstituicaoState {
  success: boolean;
  message: string;
}
export async function cadastrarInstituicao(
  prevState: InstituicaoState | null,
  formData: FormData,
): Promise<InstituicaoState> {
  const nome = formData.get("nome_instituicao") as string;
  const responsavel = formData.get("responsavel") as string;
  const contato = formData.get("contato") as string;
  const quantidade_vagas = formData.get("quantidade_vagas") as string;

  try {
    await db.query(
      "INSERT INTO instituicoes(nome_instituicao, responsavel, contato, quantidade_vagas) VALUES (?, ?, ?, ?)",
      [nome, responsavel, contato, parseInt(quantidade_vagas) || 0],
    );
    revalidatePath("/admin/instituicoes");
    return { success: true, message: "Instituição cadastrada com sucesso!" };
  } catch (err) {
    console.error("Erro ao cadastrar instituição:", err);
    return {
      success: false,
      message: "Erro ao conectar com o banco de dados.",
    };
  }
}
