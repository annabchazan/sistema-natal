"use server";
import crypto from "crypto";
import db from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getUsuarioAutenticado, validarPermissaoAdmin } from "@/lib/auth";
import { enviarConfirmacaoApadrinhamento, enviarNotificacaoEntrega, enviarCancelamentoApadrinamento, enviarAvisoDesistenciaEquipe } from "@/lib/email";
import { obterOuCriarCampanhaAtiva } from "@/app/actions/campanhas";
import { NUMERACAO_MANUAL_CARTINHAS } from "@/lib/config";
import { tipoImagemDoArquivo } from "@/lib/imagem";
import { dentroDoLimite } from "@/lib/rateLimit";
import { idValido, idsValidos } from "@/lib/seguranca";
import { padrinhoDeveSerLiberado, statusLivre } from "@/lib/statusCartinha";
import type { RowDataPacket } from "mysql2/promise";

export interface CartinhaState {
  success: boolean;
  message: string;
}

export interface FiltrosCartinhas {
  tag_id?: number;
  instituicao_id?: number;
  nome_crianca?: string;
  idade_min?: number;
  idade_max?: number;
}

const LIMITE_BUSCA_NOME = 100;

// Escapa os curingas do LIKE pra busca tratar "%" e "_" digitados como texto.
function escaparLike(valor: string) {
  return valor.replace(/[\\%_]/g, (c) => `\\${c}`);
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
  apadrinhado_por_usuario_id: number | null;
  nome_padrinho: string | null;
  email_padrinho: string | null;
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

  // Upload assinado (chave + segredo) tem prioridade: o preset sem assinatura deixa
  // qualquer um que descubra o nome do preset enviar arquivos pra conta.
  if (apiKey && apiSecret) {
    const timestamp = Math.floor(Date.now() / 1000);
    const paramString = `timestamp=${timestamp}`;
    const signature = crypto
      .createHash("sha1")
      .update(`${paramString}${apiSecret}`)
      .digest("hex");
    formData.append("api_key", apiKey);
    formData.append("timestamp", String(timestamp));
    formData.append("signature", signature);
  } else if (uploadPreset) {
    formData.append("upload_preset", uploadPreset);
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
  const numero_sequencial_manual = NUMERACAO_MANUAL_CARTINHAS
    ? Number(formData.get("numero_sequencial"))
    : null;

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

  if (
    nome_crianca.length > 100 ||
    presente_pedido.length > 500 ||
    texto_cartinha.length > 5000 ||
    (observacao_especial?.length ?? 0) > 1000
  ) {
    return { success: false, message: "Algum campo passou do tamanho máximo permitido." };
  }

  if (id && idValido(id) === null) {
    return { success: false, message: "Cartinha inválida." };
  }

  if (!Number.isInteger(instituicao_id) || instituicao_id <= 0) {
    return { success: false, message: "Selecione uma instituição válida." };
  }

  if (tag_id !== null && (!Number.isInteger(tag_id) || tag_id <= 0)) {
    return { success: false, message: "Categoria (tag) inválida." };
  }

  if (
    NUMERACAO_MANUAL_CARTINHAS &&
    (!Number.isInteger(numero_sequencial_manual) || (numero_sequencial_manual as number) <= 0)
  ) {
    return { success: false, message: "Número da cartinha inválido." };
  }

  try {
    const [instituicaoExiste] = await db.query<CartinhaIdRow[]>(
      "SELECT id FROM instituicoes WHERE id = ? LIMIT 1",
      [instituicao_id],
    );
    if (instituicaoExiste.length === 0) {
      return { success: false, message: "Instituição não encontrada." };
    }

    if (NUMERACAO_MANUAL_CARTINHAS) {
      const [duplicado] = await db.query<CartinhaIdRow[]>(
        id
          ? "SELECT id FROM cartinhas WHERE instituicao_id = ? AND numero_sequencial = ? AND id != ? LIMIT 1"
          : "SELECT id FROM cartinhas WHERE instituicao_id = ? AND numero_sequencial = ? LIMIT 1",
        id
          ? [instituicao_id, numero_sequencial_manual, Number(id)]
          : [instituicao_id, numero_sequencial_manual],
      );
      if (duplicado.length > 0) {
        return { success: false, message: "Já existe uma cartinha com esse número nessa instituição." };
      }
    }

    let fotoPath: string | null = null;

    if (foto_cartinha && foto_cartinha.size > 0) {
      if (foto_cartinha.size > 5 * 1024 * 1024) {
        return { success: false, message: "Foto muito grande. Máximo 5MB." };
      }
      // Tipo pela assinatura do conteúdo, não pelo Content-Type que o navegador informa.
      if ((await tipoImagemDoArquivo(foto_cartinha)) === null) {
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
                c.foto_cartinha, c.apadrinhado_por_usuario_id,
                c.nome_padrinho, c.email_padrinho,
                u.nome AS padrinho_nome, u.email AS padrinho_email
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

      const sqlAtualizar =
        NUMERACAO_MANUAL_CARTINHAS
          ? `UPDATE cartinhas
             SET nome_crianca = ?, idade = ?, texto_cartinha = ?, presente_pedido = ?,
                 instituicao_id = ?, tag_id = ?, numero_sequencial = ?,
                 foto_cartinha = ?,
                 data_limite_entrega = ?, status = ?,
                 necessidade_especial = ?, observacao_especial = ?
             WHERE id = ?`
          : `UPDATE cartinhas
             SET nome_crianca = ?, idade = ?, texto_cartinha = ?, presente_pedido = ?,
                 instituicao_id = ?, tag_id = ?,
                 foto_cartinha = ?,
                 data_limite_entrega = ?, status = ?,
                 necessidade_especial = ?, observacao_especial = ?
             WHERE id = ?`;
      const paramsAtualizar =
        NUMERACAO_MANUAL_CARTINHAS
          ? [
              nome_crianca, idade, texto_cartinha, presente_pedido,
              instituicao_id, tag_id, numero_sequencial_manual,
              fotoFinal,
              data_limite_entrega || null, status,
              necessidade_especial, observacao_especial, Number(id),
            ]
          : [
              nome_crianca, idade, texto_cartinha, presente_pedido,
              instituicao_id, tag_id, fotoFinal,
              data_limite_entrega || null, status,
              necessidade_especial, observacao_especial, Number(id),
            ];

      const dadosAnteriores = anterior?.[0];
      const liberaPadrinho = padrinhoDeveSerLiberado(status, {
        usuarioId: dadosAnteriores?.apadrinhado_por_usuario_id ?? null,
        emailSnapshot: dadosAnteriores?.email_padrinho ?? null,
      });

      if (liberaPadrinho && dadosAnteriores) {
        // A cartinha volta pra lista: solta o padrinho e, se ela estava de fato apadrinhada
        // (não só com vínculo velho), registra a desistência como o cancelamento do padrinho faz.
        const nomePadrinho = dadosAnteriores.padrinho_nome ?? dadosAnteriores.nome_padrinho;
        const emailPadrinho = dadosAnteriores.padrinho_email ?? dadosAnteriores.email_padrinho;
        const estavaApadrinhada = !statusLivre(statusAnterior);
        const conn = await db.getConnection();
        try {
          await conn.beginTransaction();
          await conn.query(sqlAtualizar, paramsAtualizar);
          await conn.query(
            `UPDATE cartinhas
             SET apadrinhado_por_usuario_id = NULL, data_apadrinamento = NULL,
                 nome_padrinho = NULL, email_padrinho = NULL
             WHERE id = ?`,
            [Number(id)],
          );
          if (estavaApadrinhada && nomePadrinho && emailPadrinho) {
            await conn.query(
              `INSERT INTO desistencias (cartinha_id, usuario_id, nome_padrinho, email_padrinho, nome_crianca, numero_sequencial)
               VALUES (?, ?, ?, ?, ?, ?)`,
              [
                Number(id), dadosAnteriores.apadrinhado_por_usuario_id,
                nomePadrinho, emailPadrinho,
                dadosAnteriores.nome_crianca, dadosAnteriores.numero_sequencial,
              ],
            );
          }
          await conn.commit();
        } catch (err) {
          await conn.rollback();
          throw err;
        } finally {
          conn.release();
        }
      } else {
        await db.query(sqlAtualizar, paramsAtualizar);
      }

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
      const numeroSequencial = NUMERACAO_MANUAL_CARTINHAS
        ? (numero_sequencial_manual as number)
        : await gerarNumeroSequencial(instituicao_id);
      const campanhaId = await obterOuCriarCampanhaAtiva();
      await db.query(
        `INSERT INTO cartinhas
           (campanha_id, nome_crianca, idade, texto_cartinha, presente_pedido,
            instituicao_id, tag_id, numero_sequencial,
            foto_cartinha, data_limite_entrega, status,
            necessidade_especial, observacao_especial)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          campanhaId, nome_crianca, idade, texto_cartinha, presente_pedido,
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
  const idLimpo = idValido(id);
  if (idLimpo === null) {
    return { success: false, message: "Cartinha inválida." };
  }
  try {
    await db.query("DELETE FROM cartinhas WHERE id = ?", [idLimpo]);
    revalidatePath("/admin");
    revalidatePath("/");
    return { success: true, message: "Cartinha removida com sucesso!" };
  } catch (err) {
    console.error("Erro ao excluir:", err);
    return { success: false, message: "Erro ao excluir cartinha." };
  }
}

interface CartinhaEntregaRow extends RowDataPacket {
  id: number;
  nome_crianca: string;
  presente_pedido: string;
  numero_sequencial: number;
  padrinho_nome: string | null;
  padrinho_email: string | null;
}

// --- MARCAR VÁRIAS CARTINHAS COMO ENTREGUES (ex: entrega em massa na Festa de Natal) ---
export async function marcarCartinhasEntregues(ids: number[]): Promise<CartinhaState> {
  const permissao = await validarPermissaoAdmin("edit");
  if (!permissao.ok) {
    return { success: false, message: permissao.message };
  }

  const idsLimpos = idsValidos(ids, 1000);
  if (!idsLimpos) {
    return { success: false, message: "Nenhuma cartinha selecionada." };
  }
  ids = idsLimpos;

  try {
    const placeholders = ids.map(() => "?").join(",");
    const [candidatas] = await db.query<CartinhaEntregaRow[]>(
      `SELECT c.id, c.nome_crianca, c.presente_pedido, c.numero_sequencial,
              u.nome AS padrinho_nome, u.email AS padrinho_email
       FROM cartinhas c
       LEFT JOIN usuarios u ON c.apadrinhado_por_usuario_id = u.id
       WHERE c.id IN (${placeholders}) AND c.status NOT IN ('entregue', 'cancelada')`,
      ids,
    );

    if (candidatas.length === 0) {
      return { success: false, message: "As cartinhas selecionadas já estão entregues ou canceladas." };
    }

    const idsParaAtualizar = candidatas.map((c) => c.id);
    const placeholdersAtualizar = idsParaAtualizar.map(() => "?").join(",");
    await db.query(
      `UPDATE cartinhas SET status = 'entregue' WHERE id IN (${placeholdersAtualizar})`,
      idsParaAtualizar,
    );

    for (const cartinha of candidatas) {
      if (cartinha.padrinho_email) {
        enviarNotificacaoEntrega({
          nomePadrinho: cartinha.padrinho_nome ?? "",
          emailPadrinho: cartinha.padrinho_email,
          nomeCrianca: cartinha.nome_crianca,
          presentePedido: cartinha.presente_pedido,
          numeroSequencial: cartinha.numero_sequencial,
        }).catch((err) => console.error("Falha no e-mail de entrega:", err));
      }
    }

    revalidatePath("/admin");
    revalidatePath("/");

    const total = candidatas.length;
    return {
      success: true,
      message: `${total} cartinha${total !== 1 ? "s" : ""} marcada${total !== 1 ? "s" : ""} como entregue${total !== 1 ? "s" : ""}!`,
    };
  } catch (err) {
    console.error("Erro ao marcar cartinhas como entregues:", err);
    return { success: false, message: "Erro ao marcar cartinhas como entregues." };
  }
}

interface CartinhaCheckoutRow extends RowDataPacket {
  id: number;
  nome_crianca: string;
  idade: number;
  texto_cartinha: string;
  presente_pedido: string;
  status: string;
  foto_cartinha: string | null;
  numero_sequencial: number | null;
}

// --- BUSCAR DADOS ATUAIS DAS CARTINHAS DO CARRINHO (checkout) ---
export async function buscarCartinhasParaCheckout(
  ids: number[],
): Promise<CartinhaCheckoutRow[]> {
  // Mesmo limite do checkout (20): sem isso, qualquer um mandava milhares de ids de uma vez.
  const idsLimpos = idsValidos(ids, 20);
  if (!idsLimpos) return [];
  ids = idsLimpos;
  try {
    const placeholders = ids.map(() => "?").join(",");
    const [cartinhas] = await db.query<CartinhaCheckoutRow[]>(
      `SELECT id, nome_crianca, idade, texto_cartinha, presente_pedido, status, foto_cartinha, numero_sequencial
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

// Os argumentos vêm do navegador: sem clamp, `itensPorPagina` gigante ou `pagina` negativa
// viram consulta enorme ou OFFSET inválido.
function limitarPaginacao(pagina: number, itensPorPagina: number) {
  const p = Number.isSafeInteger(pagina) && pagina >= 1 && pagina <= 10000 ? pagina : 1;
  const n = Number.isSafeInteger(itensPorPagina) && itensPorPagina >= 1 ? Math.min(itensPorPagina, 60) : ITENS_POR_PAGINA_HOME;
  return { pagina: p, itensPorPagina: n };
}

export async function listarCartinhas(
  pagina: number = 1,
  itensPorPagina: number = ITENS_POR_PAGINA_HOME,
): Promise<ListaCartinhasPublicaResultado> {
  try {
    ({ pagina, itensPorPagina } = limitarPaginacao(pagina, itensPorPagina));
    const offset = (pagina - 1) * itensPorPagina;

    const [[{ total }]] = await db.query<ContagemHomeRow[]>(
      `SELECT COUNT(*) as total FROM cartinhas
       WHERE status IN ('disponivel', 'carente')
         AND campanha_id = (SELECT id FROM campanhas WHERE data_encerramento IS NULL LIMIT 1)`,
    );

    const [cartinhas] = await db.query<CartinhaPublicaRow[]>(
      `SELECT ${COLUNAS_CARTINHA_PUBLICA}
       FROM cartinhas c
       LEFT JOIN tags t ON c.tag_id = t.id
       WHERE c.status IN ('disponivel', 'carente')
         AND c.campanha_id = (SELECT id FROM campanhas WHERE data_encerramento IS NULL LIMIT 1)
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
      `SELECT COUNT(*) as total FROM cartinhas
       WHERE status NOT IN ('disponivel', 'carente', 'cancelada')
         AND campanha_id = (SELECT id FROM campanhas WHERE data_encerramento IS NULL LIMIT 1)`,
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
    const condicoes: string[] = [
      "c.status IN ('disponivel', 'carente')",
      "c.campanha_id = (SELECT id FROM campanhas WHERE data_encerramento IS NULL LIMIT 1)",
    ];
    const params: (string | number)[] = [];

    const tagId = idValido(filtros.tag_id);
    if (tagId !== null) {
      condicoes.push("c.tag_id = ?");
      params.push(tagId);
    }
    const instituicaoId = idValido(filtros.instituicao_id);
    if (instituicaoId !== null) {
      condicoes.push("c.instituicao_id = ?");
      params.push(instituicaoId);
    }
    const nomeBusca =
      typeof filtros.nome_crianca === "string"
        ? filtros.nome_crianca.trim().slice(0, LIMITE_BUSCA_NOME)
        : "";
    if (nomeBusca) {
      // Busca única: bate no nome da criança ou no presente pedido (ex.: "bola", "boneca").
      condicoes.push("(c.nome_crianca LIKE ? OR c.presente_pedido LIKE ?)");
      const termo = `%${escaparLike(nomeBusca)}%`;
      params.push(termo, termo);
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
    ({ pagina, itensPorPagina } = limitarPaginacao(pagina, itensPorPagina));
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
  if (!Array.isArray(cartas_ids) || cartas_ids.length === 0) {
    return { success: false, message: "Nenhuma cartinha selecionada." };
  }
  if (cartas_ids.length > LIMITE_POR_CHECKOUT) {
    return {
      success: false,
      message: `Você pode apadrinhar no máximo ${LIMITE_POR_CHECKOUT} cartinhas por vez.`,
    };
  }
  const idsLimpos = idsValidos(cartas_ids, LIMITE_POR_CHECKOUT);
  if (!idsLimpos) {
    return { success: false, message: "Cartinhas inválidas." };
  }
  cartas_ids = idsLimpos;

  // Trava quem tenta acumular cartinhas em massa (uma conta só, muitas requisições).
  if (!(await dentroDoLimite(`apadrinhar:usuario:${usuario.id}`, 20, 60 * 60))) {
    return { success: false, message: "Muitas tentativas de apadrinhamento. Aguarde alguns minutos." };
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
  if (idValido(cartinhaId) === null) {
    return { success: false, message: "Cartinha inválida." };
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
