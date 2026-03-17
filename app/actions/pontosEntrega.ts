"use server";
import db from "@/lib/db";
import { revalidatePath } from "next/cache";
export interface PontoEntregaState {
  success: boolean;
  message: string;
}
export async function cadastrarPontoEntrega(
  prevState: PontoEntregaState | null,
  formData: FormData,
): Promise<PontoEntregaState> {
  const nome = formData.get("nome_local") as string;
  const endereco = formData.get("endereco") as string;
  const horario = formData.get("horario") as string;

  try {
    await db.query(
      "INSERT INTO pontos_entrega(nome_local,  endereco, horario) VALUES (?, ?, ?)",
      [nome, endereco, horario],
    );
    revalidatePath("/admin/pontos-entrega");
    return {
      success: true,
      message: "Ponto de entrega cadastrado com sucesso!",
    };
  } catch (err) {
    console.error("Erro ao cadastrar ponto de entrega:", err);
    return {
      success: false,
      message: "Erro ao conectar com o banco de dados.",
    };
  }
}

// --- FUNÇÃO PARA LISTAR PONTOS DE ENTREGA ---
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
