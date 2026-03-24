"use server";

import db from "@/lib/db";
import { revalidatePath } from "next/cache";
import { validarPermissaoAdmin } from "@/lib/auth";

export interface PontoEntregaState {
  success: boolean;
  message: string;
}

export async function salvarPontoEntrega(
  prevState: PontoEntregaState | null,
  formData: FormData,
): Promise<PontoEntregaState> {
  const id = String(formData.get("id") ?? "").trim();
  const nome = String(formData.get("nome_local") ?? "").trim();
  const endereco = String(formData.get("endereco") ?? "").trim();
  const horario = String(formData.get("horario") ?? "").trim();

  const permissao = await validarPermissaoAdmin(id ? "edit" : "manage");
  if (!permissao.ok) {
    return { success: false, message: permissao.message };
  }

  if (!nome || !endereco || !horario) {
    return {
      success: false,
      message: "Preencha nome, endereco e horario do ponto de entrega.",
    };
  }

  try {
    if (id) {
      await db.query(
        "UPDATE pontos_entrega SET nome_local = ?, endereco = ?, horario = ? WHERE id = ?",
        [nome, endereco, horario, Number(id)],
      );
    } else {
      await db.query(
        "INSERT INTO pontos_entrega(nome_local, endereco, horario) VALUES (?, ?, ?)",
        [nome, endereco, horario],
      );
    }

    revalidatePath("/admin");
    revalidatePath("/admin/pontos-entrega");
    revalidatePath("/pontos-entrega");
    revalidatePath("/");

    return {
      success: true,
      message: id
        ? "Ponto de entrega atualizado com sucesso!"
        : "Ponto de entrega cadastrado com sucesso!",
    };
  } catch (err) {
    console.error("Erro ao salvar ponto de entrega:", err);
    return {
      success: false,
      message: "Erro ao conectar com o banco de dados.",
    };
  }
}

export async function excluirPontoEntrega(
  id: number,
): Promise<PontoEntregaState> {
  const permissao = await validarPermissaoAdmin("manage");
  if (!permissao.ok) {
    return { success: false, message: permissao.message };
  }

  try {
    await db.query("DELETE FROM pontos_entrega WHERE id = ?", [id]);
    revalidatePath("/admin");
    revalidatePath("/admin/pontos-entrega");
    revalidatePath("/pontos-entrega");
    revalidatePath("/");
    return { success: true, message: "Ponto de entrega removido com sucesso!" };
  } catch (err) {
    console.error("Erro ao excluir ponto de entrega:", err);
    return {
      success: false,
      message: "Nao foi possivel excluir o ponto de entrega.",
    };
  }
}

export async function listarPontosEntrega() {
  try {
    const [pontos] = await db.query(
      "SELECT * FROM pontos_entrega ORDER BY nome_local ASC",
    );
    return pontos as any[];
  } catch (err) {
    console.error("Erro ao listar pontos de entrega:", err);
    return [];
  }
}
