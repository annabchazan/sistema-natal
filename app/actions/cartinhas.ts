"use server";
import db from "@/lib/db";
import { revalidatePath } from "next/cache";

export interface CartinhaState {
  success: boolean;
  message: string;
}

// --- FUNÇÃO HELPER: GERAR NÚMERO SEQUENCIAL POR INSTITUIÇÃO ---
async function gerarNumeroSequencial(instituicao_id: number): Promise<number> {
  try {
    // Pega o número de vagas da instituição
    const [instituicao]: any = await db.query(
      "SELECT quantidade_vagas FROM instituicoes WHERE id = ?",
      [instituicao_id],
    );

    if (!instituicao || !instituicao[0]) {
      throw new Error("Instituição não encontrada");
    }

    // Pega a base (quanto começa para essa instituição)
    const [instituicoes]: any = await db.query(
      "SELECT id, quantidade_vagas FROM instituicoes ORDER BY id ASC",
    );

    let numeroBase = 0;
    for (const inst of instituicoes) {
      if (inst.id === instituicao_id) break;
      numeroBase += inst.quantidade_vagas;
    }

    // Conta quantas cartinhas já existem para essa instituição
    const [countResult]: any = await db.query(
      "SELECT COUNT(*) as total FROM cartinhas WHERE instituicao_id = ?",
      [instituicao_id],
    );

    const proximoNumero = numeroBase + (countResult[0]?.total || 0);
    return proximoNumero;
  } catch (err) {
    console.error("Erro ao gerar número sequencial:", err);
    return 0;
  }
}

// --- FUNÇÃO PARA SALVAR (CADASTRA OU EDITA) ---
export async function salvarCartinha(
  prevstate: CartinhaState | null,
  formData: FormData,
): Promise<CartinhaState> {
  const id = formData.get("id") as string; // Pegamos o ID se ele existir
  const nome_crianca = formData.get("nome_crianca") as string;
  const idade = formData.get("idade") as string;
  const texto_cartinha = formData.get("texto_cartinha") as string;
  const presente_pedido = formData.get("presente_pedido") as string;
  const instituicao_id = formData.get("instituicao_id") as string;
  const tag_id_raw = formData.get("tag_id") as string;
  const tag_id = tag_id_raw === "" ? null : tag_id_raw;
  const foto_cartinha = formData.get("foto_cartinha") as File | null;
  const data_limite_entrega = formData.get("data_limite_entrega") as string;

  try {
    let fotoPath = null;

    // Processar upload da foto se existir
    if (foto_cartinha && foto_cartinha.size > 0) {
      // Validar tamanho (5MB máximo)
      if (foto_cartinha.size > 5 * 1024 * 1024) {
        return { success: false, message: "Foto muito grande. Máximo 5MB." };
      }

      // Validar tipo
      const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
      if (!allowedTypes.includes(foto_cartinha.type)) {
        return {
          success: false,
          message: "Tipo de arquivo não permitido. Use JPG, PNG ou GIF.",
        };
      }

      // Gerar nome único para a foto
      const fileExtension = foto_cartinha.name.split(".").pop();
      const fileName = `cartinha_${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExtension}`;

      // Salvar foto no diretório public/uploads
      const fs = require("fs").promises;
      const path = require("path");

      const uploadDir = path.join(process.cwd(), "public", "uploads");
      await fs.mkdir(uploadDir, { recursive: true });

      const buffer = await foto_cartinha.arrayBuffer();
      await fs.writeFile(path.join(uploadDir, fileName), Buffer.from(buffer));

      fotoPath = `/uploads/${fileName}`;
    }

    if (id) {
      // SE TEM ID, É EDIÇÃO (UPDATE)
      await db.query(
        "UPDATE cartinhas SET nome_crianca = ?, idade = ?, texto_cartinha = ?, presente_pedido = ?, instituicao_id = ?, tag_id = ?, foto_cartinha = COALESCE(?, foto_cartinha), data_limite_entrega = ? WHERE id = ?",
        [
          nome_crianca,
          Number(idade),
          texto_cartinha,
          presente_pedido,
          Number(instituicao_id),
          tag_id,
          fotoPath,
          data_limite_entrega || null,
          Number(id),
        ],
      );
    } else {
      // SE NÃO TEM ID, É CADASTRO NOVO (INSERT)
      // Gera o número sequencial para essa instituição
      const numeroSequencial = await gerarNumeroSequencial(
        Number(instituicao_id),
      );

      await db.query(
        "INSERT INTO cartinhas(nome_crianca, idade, texto_cartinha, presente_pedido, instituicao_id, tag_id, numero_sequencial, foto_cartinha, data_limite_entrega) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          nome_crianca,
          Number(idade),
          texto_cartinha,
          presente_pedido,
          Number(instituicao_id),
          tag_id,
          numeroSequencial,
          fotoPath,
          data_limite_entrega || null,
        ],
      );
    }

    revalidatePath("/admin");
    revalidatePath("/");

    return {
      success: true,
      message: id ? "Cartinha atualizada!" : "Cartinha cadastrada!",
    };
  } catch (err) {
    console.error("Erro na operação:", err);
    return { success: false, message: "Erro ao salvar no banco." };
  }
}

// --- FUNÇÃO PARA EXCLUIR ---
export async function excluirCartinha(id: number): Promise<CartinhaState> {
  try {
    await db.query("DELETE FROM cartinhas WHERE id = ?", [id]);

    revalidatePath("/admin");
    revalidatePath("/");

    return { success: true, message: "Cartinha removida com sucesso!" };
  } catch (err) {
    console.error("Erro ao excluir:", err);
    return { success: false, message: "Erro ao excluir cartinha." };
  }
}

// --- FUNÇÃO PARA LISTAR CARTINHAS ---
export async function listarCartinhas() {
  try {
    const [cartinhas] = await db.query(
      "SELECT * FROM cartinhas ORDER BY id DESC",
    );
    return cartinhas as any[];
  } catch (err) {
    console.error("Erro ao listar cartinhas:", err);
    return [];
  }
}

// --- FUNÇÃO PARA FINALIZAR APADRINAMENTO ---
export async function finalizarApadrinamento(
  cartas_ids: number[],
): Promise<CartinhaState> {
  try {
    if (cartas_ids.length === 0) {
      return { success: false, message: "Nenhuma cartinha selecionada." };
    }

    // Marca as cartinhas como apadrinadas (exemplo: adiciona uma coluna apadrinada = 1)
    const placeholders = cartas_ids.map(() => "?").join(",");
    await db.query(
      `UPDATE cartinhas SET apadrinada = 1, data_apadrinamento = NOW() WHERE id IN (${placeholders})`,
      cartas_ids,
    );

    revalidatePath("/");

    return {
      success: true,
      message: `${cartas_ids.length} cartinha${cartas_ids.length !== 1 ? "s" : ""} apadrinada${cartas_ids.length !== 1 ? "s" : ""} com sucesso!`,
    };
  } catch (err) {
    console.error("Erro ao finalizar apadrinamento:", err);
    return { success: false, message: "Erro ao finalizar apadrinamento." };
  }
}
