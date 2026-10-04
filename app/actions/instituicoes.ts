"use server";

import db from "@/lib/db";
import { revalidatePath } from "next/cache";
import { validarPermissaoAdmin } from "@/lib/auth";
import { idValido } from "@/lib/seguranca";
import type { RowDataPacket } from "mysql2/promise";

export interface InstituicaoState {
  success: boolean;
  message: string;
}

// Só o que o filtro da home precisa. Contato e responsável não saem num payload público.
export interface InstituicaoPublicaRow extends RowDataPacket {
  id: number;
  nome_instituicao: string;
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

  if (
    !nome || !responsavel || !contato ||
    nome.length > 150 || responsavel.length > 150 || contato.length > 150 ||
    !Number.isInteger(quantidadeVagas) || quantidadeVagas < 0 || quantidadeVagas > 100000 ||
    (id !== "" && idValido(id) === null)
  ) {
    return {
      success: false,
      message: "Preencha todos os campos da instituição corretamente.",
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
        ? "Instituição atualizada com sucesso!"
        : "Instituição cadastrada com sucesso!",
    };
  } catch (err) {
    console.error("Erro ao salvar instituição:", err);
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
    return { success: true, message: "Instituição removida com sucesso!" };
  } catch (err) {
    console.error("Erro ao excluir instituição:", err);
    return {
      success: false,
      message:
        "Não foi possível excluir a instituição. Verifique se existem cartinhas vinculadas.",
    };
  }
}

// --- LISTA PÚBLICA (filtro da home) ---
// Só instituições com cartinha disponível na campanha ativa, pra não oferecer opção vazia.
export async function listarInstituicoesComCartinhas(): Promise<InstituicaoPublicaRow[]> {
  try {
    const [instituicoes] = await db.query<InstituicaoPublicaRow[]>(
      `SELECT DISTINCT i.id, i.nome_instituicao
       FROM instituicoes i
       JOIN cartinhas c ON c.instituicao_id = i.id
       WHERE c.status IN ('disponivel', 'carente')
         AND c.campanha_id = (SELECT id FROM campanhas WHERE data_encerramento IS NULL LIMIT 1)
       ORDER BY i.nome_instituicao ASC`,
    );
    return instituicoes;
  } catch (err) {
    console.error("Erro ao listar instituições:", err);
    return [];
  }
}
