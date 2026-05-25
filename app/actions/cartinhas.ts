"use server";
import crypto from "crypto";
import db from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getUsuarioAutenticado, validarPermissaoAdmin } from "@/lib/auth";
import { enviarConfirmacaoApadrinhamento, enviarNotificacaoEntrega } from "@/lib/email";

export interface CartinhaState {
  success: boolean;
  message: string;
}

const STATUS_PERMITIDOS = [
  "disponivel",
  "apadrinhada",
  "conferida",
  "carente",
  "embrulhado",
  "reapadrinhado",
  "entregue",
  "cancelada",
] as const;

type StatusCartinha = (typeof STATUS_PERMITIDOS)[number];

// --- UPLOAD CLOUDINARY ---
async function uploadToCloudinary(file: File): Promise<string | null> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  if (!cloudName) return null;

  const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
  const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  const formData = new FormData();
  formData.append("file", file);

  if (uploadPreset) {
    formData.append("upload_preset", uploadPreset);
  } else if (apiKey && apiSecret) {
    const timestamp = Math.floor(Date.now() / 1000);
    const paramString = `timestamp=${timestamp}`;
    const signature = crypto
      .createHash("sha1")
      .update(`${paramString}${apiSecret}`)
      .digest("hex");
    formData.append("api_key", apiKey);
    formData.append("timestamp", String(timestamp));
    formData.append("signature", signature);
  } else {
    return null;
  }

  try {
    const response = await fetch(uploadUrl, { method: "POST", body: formData });
    if (!response.ok) {
      console.error("Falha no upload para Cloudinary", response.status, await response.text());
      return null;
    }
    const data = await response.json();
    return data.secure_url || data.url || null;
  } catch (err) {
    console.error("Erro ao enviar imagem para Cloudinary:", err);
    return null;
  }
}

// --- GERAR NÚMERO SEQUENCIAL POR INSTITUIÇÃO ---
async function gerarNumeroSequencial(instituicao_id: number): Promise<number> {
  try {
    const [[baseRows], [countRows]]: any = await Promise.all([
      db.query(
        "SELECT COALESCE(SUM(quantidade_vagas), 0) AS base FROM instituicoes WHERE id < ?",
        [instituicao_id],
      ),
      db.query(
        "SELECT COUNT(*) AS total FROM cartinhas WHERE instituicao_id = ?",
        [instituicao_id],
      ),
    ]);
    return Number(baseRows[0]?.base ?? 0) + Number(countRows[0]?.total ?? 0);
  } catch (err) {
    console.error("Erro ao gerar número sequencial:", err);
    return 0;
  }
}

// --- SALVAR CARTINHA (CRIA OU EDITA) ---
export async function salvarCartinha(
  prevstate: CartinhaState | null,
  formData: FormData,
): Promise<CartinhaState> {
  const id = formData.get("id") as string;
  const nome_crianca = formData.get("nome_crianca") as string;
  const idade = Number(formData.get("idade"));
  const texto_cartinha = formData.get("texto_cartinha") as string;
  const presente_pedido = formData.get("presente_pedido") as string;
  const instituicao_id = Number(formData.get("instituicao_id"));
  const tag_id_raw = formData.get("tag_id") as string;
  const tag_id = tag_id_raw === "" ? null : tag_id_raw;
  const foto_cartinha = formData.get("foto_cartinha") as File | null;
  const data_limite_entrega = formData.get("data_limite_entrega") as string;
  const statusRaw = (formData.get("status") as string) || "disponivel";
  const status: StatusCartinha = STATUS_PERMITIDOS.includes(statusRaw as StatusCartinha)
    ? (statusRaw as StatusCartinha)
    : "disponivel";

  const permissao = await validarPermissaoAdmin(id ? "edit" : "manage");
  if (!permissao.ok) {
    return { success: false, message: permissao.message };
  }

  try {
    let fotoPath: string | null = null;

    if (foto_cartinha && foto_cartinha.size > 0) {
      if (foto_cartinha.size > 5 * 1024 * 1024) {
        return { success: false, message: "Foto muito grande. Máximo 5MB." };
      }
      const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
      if (!allowedTypes.includes(foto_cartinha.type)) {
        return { success: false, message: "Tipo de arquivo não permitido. Use JPG, PNG ou GIF." };
      }
      const uploadedUrl = await uploadToCloudinary(foto_cartinha);
      if (uploadedUrl) {
        fotoPath = uploadedUrl;
      } else {
        const buffer = await foto_cartinha.arrayBuffer();
        const base64 = Buffer.from(buffer).toString("base64");
        fotoPath = `data:${foto_cartinha.type};base64,${base64}`;
      }
    }

    if (id) {
      // Captura status anterior e dados do padrinho antes de atualizar
      const [anterior]: any = await db.query(
        `SELECT c.status, c.nome_crianca, c.presente_pedido, c.numero_sequencial,
                u.nome AS padrinho_nome, u.email AS padrinho_email
         FROM cartinhas c
         LEFT JOIN usuarios u ON c.apadrinhado_por_usuario_id = u.id
         WHERE c.id = ? LIMIT 1`,
        [Number(id)],
      );
      const statusAnterior = anterior?.[0]?.status;

      await db.query(
        `UPDATE cartinhas
         SET nome_crianca = ?, idade = ?, texto_cartinha = ?, presente_pedido = ?,
             instituicao_id = ?, tag_id = ?,
             foto_cartinha = COALESCE(?, foto_cartinha),
             data_limite_entrega = ?, status = ?
         WHERE id = ?`,
        [
          nome_crianca, idade, texto_cartinha, presente_pedido,
          instituicao_id, tag_id, fotoPath,
          data_limite_entrega || null, status, Number(id),
        ],
      );

      // Dispara e-mail ao padrinho quando o status muda para "entregue"
      if (status === "entregue" && statusAnterior !== "entregue") {
        const padrinho = anterior?.[0];
        if (padrinho?.padrinho_email) {
          enviarNotificacaoEntrega({
            nomePadrinho:     padrinho.padrinho_nome,
            emailPadrinho:    padrinho.padrinho_email,
            nomeCrianca:      padrinho.nome_crianca,
            presentePedido:   padrinho.presente_pedido,
            numeroSequencial: padrinho.numero_sequencial,
          }).catch((err) => console.error("Falha no e-mail de entrega:", err));
        }
      }
    } else {
      const numeroSequencial = await gerarNumeroSequencial(instituicao_id);
      await db.query(
        `INSERT INTO cartinhas
           (nome_crianca, idade, texto_cartinha, presente_pedido,
            instituicao_id, tag_id, numero_sequencial,
            foto_cartinha, data_limite_entrega, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          nome_crianca, idade, texto_cartinha, presente_pedido,
          instituicao_id, tag_id, numeroSequencial,
          fotoPath, data_limite_entrega || null, status,
        ],
      );
    }

    revalidatePath("/admin");
    revalidatePath("/");
    return { success: true, message: id ? "Cartinha atualizada!" : "Cartinha cadastrada!" };
  } catch (err) {
    console.error("Erro na operação:", err);
    return { success: false, message: "Erro ao salvar no banco." };
  }
}

// --- EXCLUIR CARTINHA ---
export async function excluirCartinha(id: number): Promise<CartinhaState> {
  const permissao = await validarPermissaoAdmin("manage");
  if (!permissao.ok) {
    return { success: false, message: permissao.message };
  }
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

// --- LISTAR CARTINHAS DISPONÍVEIS (home pública) ---
export async function listarCartinhas() {
  try {
    const [cartinhas] = await db.query(
      `SELECT c.*, t.nome as tag_nome
       FROM cartinhas c
       LEFT JOIN tags t ON c.tag_id = t.id
       WHERE c.status = 'disponivel'
       ORDER BY c.id DESC`,
    );
    return cartinhas as any[];
  } catch (err) {
    console.error("Erro ao listar cartinhas:", err);
    return [];
  }
}

// --- LISTAR COM FILTROS (home pública) ---
export async function listarCartinhasFiltradas(filtros: {
  tag_id?: number;
  idade_min?: number;
  idade_max?: number;
}) {
  try {
    let query = `
      SELECT c.*, t.nome as tag_nome
      FROM cartinhas c
      LEFT JOIN tags t ON c.tag_id = t.id
      WHERE c.status = 'disponivel'
    `;
    const params: any[] = [];

    if (filtros.tag_id !== undefined && filtros.tag_id !== null) {
      query += " AND c.tag_id = ?";
      params.push(filtros.tag_id);
    }
    if (filtros.idade_min !== undefined) {
      query += " AND c.idade >= ?";
      params.push(filtros.idade_min);
    }
    if (filtros.idade_max !== undefined) {
      query += " AND c.idade <= ?";
      params.push(filtros.idade_max);
    }

    query += " ORDER BY c.id DESC";
    const [cartinhas] = await db.query(query, params);
    return cartinhas as any[];
  } catch (err) {
    console.error("Erro ao listar cartinhas filtradas:", err);
    return [];
  }
}

// --- FINALIZAR APADRINHAMENTO ---
export async function finalizarApadrinamento(
  cartas_ids: number[],
): Promise<CartinhaState> {
  const usuario = await getUsuarioAutenticado();
  if (!usuario) {
    return { success: false, message: "Você precisa estar logado para finalizar o apadrinhamento." };
  }
  if (cartas_ids.length === 0) {
    return { success: false, message: "Nenhuma cartinha selecionada." };
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const placeholders = cartas_ids.map(() => "?").join(",");

    const [disponiveis]: any = await conn.query(
      `SELECT id FROM cartinhas
       WHERE id IN (${placeholders}) AND status = 'disponivel'
       FOR UPDATE`,
      cartas_ids,
    );

    if (disponiveis.length !== cartas_ids.length) {
      await conn.rollback();
      return {
        success: false,
        message: "Algumas cartinhas já foram apadrinhadas por outra pessoa. Atualize a lista e tente novamente.",
      };
    }

    await conn.query(
      `UPDATE cartinhas
       SET status = 'apadrinhada',
           data_apadrinamento = NOW(),
           apadrinhado_por_usuario_id = ?
       WHERE id IN (${placeholders})`,
      [usuario.id, ...cartas_ids],
    );

    await conn.commit();

    // Feito após o commit para não atrasar nem bloquear a transação.
    const [[cartinhasEmail], [usuarioEmail]]: any = await Promise.all([
      db.query(
        `SELECT nome_crianca, presente_pedido, data_limite_entrega, numero_sequencial
         FROM cartinhas WHERE id IN (${placeholders})`,
        cartas_ids,
      ),
      db.query("SELECT nome, email FROM usuarios WHERE id = ? LIMIT 1", [usuario.id]),
    ]);

    if (usuarioEmail?.[0]?.email) {
      enviarConfirmacaoApadrinhamento({
        nomePadrinho: usuarioEmail[0].nome,
        emailPadrinho: usuarioEmail[0].email,
        cartinhas: cartinhasEmail,
      }).catch((err) => console.error("Falha no e-mail de confirmação:", err));
    }

    revalidatePath("/");
    revalidatePath("/usuario");

    const n = cartas_ids.length;
    return {
      success: true,
      message: `${n} cartinha${n !== 1 ? "s" : ""} apadrinada${n !== 1 ? "s" : ""} com sucesso!`,
    };
  } catch (err) {
    await conn.rollback();
    console.error("Erro ao finalizar apadrinamento:", err);
    return { success: false, message: "Erro ao finalizar apadrinamento." };
  } finally {
    conn.release();
  }
}
