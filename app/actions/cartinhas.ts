"use server";
import crypto from "crypto";
import db from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getUsuarioAutenticado, validarPermissaoAdmin } from "@/lib/auth";
import { enviarConfirmacaoApadrinhamento, enviarNotificacaoEntrega, enviarCancelamentoApadrinamento, enviarAvisoDesistenciaEquipe } from "@/lib/email";
import type { RowDataPacket } from "mysql2/promise";

export interface CartinhaState {
  success: boolean;
  message: string;
}

export interface FiltrosCartinhas {
  tag_id?: number;
  idade_min?: number;
  idade_max?: number;
}

// Apenas as colunas que a listagem pública (home) precisa exibir.
// Não inclui apadrinhado_por_usuario_id, necessidade_especial, observacao_especial
// nem data_apadrinamento — nada disso deve ser exposto num payload público/anônimo.
interface CartinhaPublicaRow extends RowDataPacket {
  id: number;
  nome_crianca: string;
  idade: number;
  texto_cartinha: string;
  presente_pedido: string;
  instituicao_id: number;
  tag_id: number | null;
  numero_sequencial: number;
  foto_cartinha: string | null;
  data_limite_entrega: string | null;
  status: string;
  tag_nome: string | null;
}

interface ListaCartinhasPublicaResultado {
  cartinhas: CartinhaPublicaRow[];
  total: number;
}

const COLUNAS_CARTINHA_PUBLICA = `
  c.id, c.nome_crianca, c.idade, c.texto_cartinha, c.presente_pedido,
  c.instituicao_id, c.tag_id, c.numero_sequencial, c.foto_cartinha,
  c.data_limite_entrega, c.status, t.nome as tag_nome
`;

interface CartinhaAnteriorRow extends RowDataPacket {
  status: string;
  nome_crianca: string;
  presente_pedido: string;
  numero_sequencial: number;
  foto_cartinha: string | null;
  padrinho_nome: string | null;
  padrinho_email: string | null;
}

interface CartinhaIdRow extends RowDataPacket {
  id: number;
}

interface CartinhaStatusRow extends RowDataPacket {
  id: number;
  status: string;
}

interface CartinhaEmailRow extends RowDataPacket {
  nome_crianca: string;
  presente_pedido: string;
  data_limite_entrega: string | null;
  numero_sequencial: number;
}

interface UsuarioEmailRow extends RowDataPacket {
  nome: string;
  email: string;
}

interface CartinhaCancelamentoRow extends RowDataPacket {
  id: number;
  nome_crianca: string;
  presente_pedido: string;
  numero_sequencial: number;
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
interface BaseVagasRow extends RowDataPacket {
  base: number;
}

interface MaxNumeroRow extends RowDataPacket {
  maximo: number | null;
}

export async function gerarNumeroSequencial(instituicao_id: number): Promise<number> {
  const [[baseRows], [maxRows]] = await Promise.all([
    db.query<BaseVagasRow[]>(
      "SELECT COALESCE(SUM(quantidade_vagas), 0) AS base FROM instituicoes WHERE id < ?",
      [instituicao_id],
    ),
    db.query<MaxNumeroRow[]>(
      "SELECT MAX(numero_sequencial) AS maximo FROM cartinhas WHERE instituicao_id = ?",
      [instituicao_id],
    ),
  ]);
  const base = Number(baseRows[0]?.base ?? 0);
  const maximoExistente = maxRows[0]?.maximo;
  return maximoExistente == null ? base : Number(maximoExistente) + 1;
}

function stringDoFormData(formData: FormData, campo: string): string {
  const valor = formData.get(campo);
  return typeof valor === "string" ? valor : "";
}

function arquivoDoFormData(formData: FormData, campo: string): File | null {
  const valor = formData.get(campo);
  return valor instanceof File ? valor : null;
}

// --- SALVAR CARTINHA (CRIA OU EDITA) ---
export async function salvarCartinha(
  prevstate: CartinhaState | null,
  formData: FormData,
): Promise<CartinhaState> {
  const id = stringDoFormData(formData, "id");
  const nome_crianca = stringDoFormData(formData, "nome_crianca");
  const idade = Number(formData.get("idade"));
  const texto_cartinha = stringDoFormData(formData, "texto_cartinha");
  const presente_pedido = stringDoFormData(formData, "presente_pedido");
  const instituicao_id = Number(formData.get("instituicao_id"));
  const tag_id_raw = stringDoFormData(formData, "tag_id");
  const tag_id = tag_id_raw === "" ? null : Number(tag_id_raw);
  const foto_cartinha = arquivoDoFormData(formData, "foto_cartinha");
  const remover_foto = formData.get("remover_foto") === "on";
  const data_limite_entrega = stringDoFormData(formData, "data_limite_entrega");
  const necessidade_especial = formData.get("necessidade_especial") === "on";
  const observacao_especial = necessidade_especial
    ? stringDoFormData(formData, "observacao_especial") || null
    : null;
  const statusRaw = stringDoFormData(formData, "status") || "disponivel";
  const status: StatusCartinha = STATUS_PERMITIDOS.includes(statusRaw as StatusCartinha)
    ? (statusRaw as StatusCartinha)
    : "disponivel";

  const permissao = await validarPermissaoAdmin(id ? "edit" : "manage");
  if (!permissao.ok) {
    return { success: false, message: permissao.message };
  }

  if (!Number.isInteger(idade) || idade < 0 || idade > 17) {
    return { success: false, message: "Idade inválida. Deve ser um número entre 0 e 17." };
  }

  if (!nome_crianca?.trim() || !presente_pedido?.trim() || !texto_cartinha?.trim()) {
    return { success: false, message: "Preencha nome da criança, presente pedido e texto da cartinha." };
  }

  if (!Number.isInteger(instituicao_id) || instituicao_id <= 0) {
    return { success: false, message: "Selecione uma instituição válida." };
  }

  if (tag_id !== null && (!Number.isInteger(tag_id) || tag_id <= 0)) {
    return { success: false, message: "Categoria (tag) inválida." };
  }

  try {
    const [instituicaoExiste] = await db.query<CartinhaIdRow[]>(
      "SELECT id FROM instituicoes WHERE id = ? LIMIT 1",
      [instituicao_id],
    );
    if (instituicaoExiste.length === 0) {
      return { success: false, message: "Instituição não encontrada." };
    }

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
      if (!uploadedUrl) {
        return { success: false, message: "Falha ao enviar a foto. Tente novamente." };
      }
      fotoPath = uploadedUrl;
    }

    if (id) {
      // Captura status anterior e dados do padrinho antes de atualizar
      const [anterior] = await db.query<CartinhaAnteriorRow[]>(
        `SELECT c.status, c.nome_crianca, c.presente_pedido, c.numero_sequencial,
                c.foto_cartinha, u.nome AS padrinho_nome, u.email AS padrinho_email
         FROM cartinhas c
         LEFT JOIN usuarios u ON c.apadrinhado_por_usuario_id = u.id
         WHERE c.id = ? LIMIT 1`,
        [Number(id)],
      );
      const statusAnterior = anterior?.[0]?.status;
      const fotoFinal = fotoPath
        ? fotoPath
        : remover_foto
          ? null
          : (anterior?.[0]?.foto_cartinha ?? null);

      await db.query(
        `UPDATE cartinhas
         SET nome_crianca = ?, idade = ?, texto_cartinha = ?, presente_pedido = ?,
             instituicao_id = ?, tag_id = ?,
             foto_cartinha = ?,
             data_limite_entrega = ?, status = ?,
             necessidade_especial = ?, observacao_especial = ?
         WHERE id = ?`,
        [
          nome_crianca, idade, texto_cartinha, presente_pedido,
          instituicao_id, tag_id, fotoFinal,
          data_limite_entrega || null, status,
          necessidade_especial, observacao_especial, Number(id),
        ],
      );

      // Dispara e-mail ao padrinho quando o status muda para "entregue"
      if (status === "entregue" && statusAnterior !== "entregue") {
        const padrinho = anterior?.[0];
        if (padrinho?.padrinho_email) {
          enviarNotificacaoEntrega({
            nomePadrinho:     padrinho.padrinho_nome ?? "",
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
            foto_cartinha, data_limite_entrega, status,
            necessidade_especial, observacao_especial)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          nome_crianca, idade, texto_cartinha, presente_pedido,
          instituicao_id, tag_id, numeroSequencial,
          fotoPath, data_limite_entrega || null, status,
          necessidade_especial, observacao_especial,
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

interface CartinhaCheckoutRow extends RowDataPacket {
  id: number;
  nome_crianca: string;
  idade: number;
  texto_cartinha: string;
  presente_pedido: string;
  status: string;
}

// --- BUSCAR DADOS ATUAIS DAS CARTINHAS DO CARRINHO (checkout) ---
export async function buscarCartinhasParaCheckout(
  ids: number[],
): Promise<CartinhaCheckoutRow[]> {
  if (ids.length === 0) return [];
  try {
    const placeholders = ids.map(() => "?").join(",");
    const [cartinhas] = await db.query<CartinhaCheckoutRow[]>(
      `SELECT id, nome_crianca, idade, texto_cartinha, presente_pedido, status
       FROM cartinhas WHERE id IN (${placeholders})`,
      ids,
    );
    return cartinhas;
  } catch (err) {
    console.error("Erro ao buscar cartinhas para checkout:", err);
    return [];
  }
}

// --- LISTAR CARTINHAS DISPONÍVEIS (home pública) ---
const ITENS_POR_PAGINA_HOME = 12;

export async function listarCartinhas(
  pagina: number = 1,
  itensPorPagina: number = ITENS_POR_PAGINA_HOME,
): Promise<ListaCartinhasPublicaResultado> {
  try {
    const offset = (pagina - 1) * itensPorPagina;

    const [[{ total }]] = await db.query<ContagemHomeRow[]>(
      `SELECT COUNT(*) as total FROM cartinhas WHERE status IN ('disponivel', 'carente')`,
    );

    const [cartinhas] = await db.query<CartinhaPublicaRow[]>(
      `SELECT ${COLUNAS_CARTINHA_PUBLICA}
       FROM cartinhas c
       LEFT JOIN tags t ON c.tag_id = t.id
       WHERE c.status IN ('disponivel', 'carente')
       ORDER BY c.id DESC
       LIMIT ? OFFSET ?`,
      [itensPorPagina, offset],
    );

    return { cartinhas, total: Number(total) };
  } catch (err) {
    console.error("Erro ao listar cartinhas:", err);
    return { cartinhas: [], total: 0 };
  }
}

interface ContagemHomeRow extends RowDataPacket {
  total: number;
}

// --- CONTAGEM PARA O HERO DA HOME ---
export async function contarCartinhasApadrinhadas(): Promise<number> {
  try {
    const [[{ total }]] = await db.query<ContagemHomeRow[]>(
      `SELECT COUNT(*) as total FROM cartinhas WHERE status NOT IN ('disponivel', 'carente', 'cancelada')`,
    );
    return Number(total);
  } catch (err) {
    console.error("Erro ao contar cartinhas apadrinhadas:", err);
    return 0;
  }
}

// --- LISTAR COM FILTROS (home pública) ---
export async function listarCartinhasFiltradas(
  filtros: FiltrosCartinhas,
  pagina: number = 1,
  itensPorPagina: number = ITENS_POR_PAGINA_HOME,
): Promise<ListaCartinhasPublicaResultado> {
  try {
    const condicoes: string[] = ["c.status IN ('disponivel', 'carente')"];
    const params: (string | number)[] = [];

    if (filtros.tag_id !== undefined && filtros.tag_id !== null) {
      condicoes.push("c.tag_id = ?");
      params.push(filtros.tag_id);
    }
    const idadeMin = filtros.idade_min;
    const idadeMax = filtros.idade_max;
    const minFinal = idadeMin !== undefined && idadeMax !== undefined && idadeMin > idadeMax ? idadeMax : idadeMin;
    const maxFinal = idadeMin !== undefined && idadeMax !== undefined && idadeMin > idadeMax ? idadeMin : idadeMax;

    if (minFinal !== undefined) {
      condicoes.push("c.idade >= ?");
      params.push(minFinal);
    }
    if (maxFinal !== undefined) {
      condicoes.push("c.idade <= ?");
      params.push(maxFinal);
    }

    const where = condicoes.join(" AND ");
    const offset = (pagina - 1) * itensPorPagina;

    const [[{ total }]] = await db.query<ContagemHomeRow[]>(
      `SELECT COUNT(*) as total FROM cartinhas c WHERE ${where}`,
      params,
    );

    const [cartinhas] = await db.query<CartinhaPublicaRow[]>(
      `SELECT ${COLUNAS_CARTINHA_PUBLICA}
       FROM cartinhas c
       LEFT JOIN tags t ON c.tag_id = t.id
       WHERE ${where}
       ORDER BY c.id DESC
       LIMIT ? OFFSET ?`,
      [...params, itensPorPagina, offset],
    );

    return { cartinhas, total: Number(total) };
  } catch (err) {
    console.error("Erro ao listar cartinhas filtradas:", err);
    return { cartinhas: [], total: 0 };
  }
}

// --- FINALIZAR APADRINHAMENTO ---
export async function finalizarApadrinamento(
  cartas_ids: number[],
): Promise<CartinhaState> {
  const LIMITE_POR_CHECKOUT = 20;

  const usuario = await getUsuarioAutenticado();
  if (!usuario) {
    return { success: false, message: "Você precisa estar logado para finalizar o apadrinhamento." };
  }
  if (cartas_ids.length === 0) {
    return { success: false, message: "Nenhuma cartinha selecionada." };
  }
  if (cartas_ids.length > LIMITE_POR_CHECKOUT) {
    return {
      success: false,
      message: `Você pode apadrinhar no máximo ${LIMITE_POR_CHECKOUT} cartinhas por vez.`,
    };
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const placeholders = cartas_ids.map(() => "?").join(",");

    const [disponiveis] = await conn.query<CartinhaStatusRow[]>(
      `SELECT id, status FROM cartinhas
       WHERE id IN (${placeholders}) AND status IN ('disponivel', 'carente')
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

    const idsNovos = disponiveis.filter((c) => c.status === "disponivel").map((c) => c.id);
    const idsReapadrinhados = disponiveis.filter((c) => c.status === "carente").map((c) => c.id);

    if (idsNovos.length > 0) {
      const ph = idsNovos.map(() => "?").join(",");
      await conn.query(
        `UPDATE cartinhas
         SET status = 'apadrinhada',
             data_apadrinamento = NOW(),
             apadrinhado_por_usuario_id = ?
         WHERE id IN (${ph})`,
        [usuario.id, ...idsNovos],
      );
    }

    if (idsReapadrinhados.length > 0) {
      const ph = idsReapadrinhados.map(() => "?").join(",");
      await conn.query(
        `UPDATE cartinhas
         SET status = 'reapadrinhado',
             data_apadrinamento = NOW(),
             apadrinhado_por_usuario_id = ?
         WHERE id IN (${ph})`,
        [usuario.id, ...idsReapadrinhados],
      );
    }

    await conn.commit();

    // Feito após o commit para não atrasar nem bloquear a transação.
    const [[cartinhasEmail], [usuarioEmail]] = await Promise.all([
      db.query<CartinhaEmailRow[]>(
        `SELECT nome_crianca, presente_pedido, data_limite_entrega, numero_sequencial
         FROM cartinhas WHERE id IN (${placeholders})`,
        cartas_ids,
      ),
      db.query<UsuarioEmailRow[]>("SELECT nome, email FROM usuarios WHERE id = ? LIMIT 1", [usuario.id]),
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
      message: `${n} cartinha${n !== 1 ? "s" : ""} apadrinhada${n !== 1 ? "s" : ""} com sucesso!`,
    };
  } catch (err) {
    await conn.rollback();
    console.error("Erro ao finalizar apadrinamento:", err);
    return { success: false, message: "Erro ao finalizar apadrinamento." };
  } finally {
    conn.release();
  }
}

// --- CANCELAR APADRINHAMENTO (pelo padrinho) ---
export async function cancelarApadrinamento(
  cartinhaId: number,
): Promise<CartinhaState> {
  const usuario = await getUsuarioAutenticado();
  if (!usuario) {
    return { success: false, message: "Você precisa estar logado." };
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // Só cancela se a cartinha for do usuário e ainda estiver como 'apadrinhada'
    const [rows] = await conn.query<CartinhaCancelamentoRow[]>(
      `SELECT id, nome_crianca, presente_pedido, numero_sequencial FROM cartinhas
       WHERE id = ? AND apadrinhado_por_usuario_id = ? AND status = 'apadrinhada'
       FOR UPDATE`,
      [cartinhaId, usuario.id],
    );

    if (!rows?.length) {
      await conn.rollback();
      return {
        success: false,
        message: "Não foi possível cancelar. A cartinha já está em processamento ou não pertence a você.",
      };
    }

    const cartinha = rows[0];

    await conn.query(
      `UPDATE cartinhas
       SET status = 'carente',
           apadrinhado_por_usuario_id = NULL,
           data_apadrinamento = NULL
       WHERE id = ?`,
      [cartinhaId],
    );

    await conn.query(
      `INSERT INTO desistencias (cartinha_id, usuario_id, nome_padrinho, email_padrinho, nome_crianca, numero_sequencial)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [cartinhaId, usuario.id, usuario.nome, usuario.email, cartinha.nome_crianca, cartinha.numero_sequencial],
    );

    await conn.commit();

    enviarCancelamentoApadrinamento({
      nomePadrinho:     usuario.nome,
      emailPadrinho:    usuario.email,
      nomeCrianca:      cartinha.nome_crianca,
      presentePedido:   cartinha.presente_pedido,
      numeroSequencial: cartinha.numero_sequencial,
    }).catch((err) => console.error("Falha no e-mail de cancelamento:", err));

    enviarAvisoDesistenciaEquipe({
      nomePadrinho:     usuario.nome,
      emailPadrinho:    usuario.email,
      nomeCrianca:      cartinha.nome_crianca,
      numeroSequencial: cartinha.numero_sequencial,
    }).catch((err) => console.error("Falha no aviso de desistência para a equipe:", err));

    revalidatePath("/usuario");
    revalidatePath("/");

    return { success: true, message: "Apadrinhamento cancelado. A cartinha voltou para a lista." };
  } catch (err) {
    await conn.rollback();
    console.error("Erro ao cancelar apadrinamento:", err);
    return { success: false, message: "Erro ao cancelar. Tente novamente." };
  } finally {
    conn.release();
  }
}
