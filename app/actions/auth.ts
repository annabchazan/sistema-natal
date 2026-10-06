"use server";

import crypto from "crypto";
import db from "@/lib/db";
import {
  calcularBloqueioAposFalha,
  criarSessao,
  gerarHashSenha,
  getUsuarioAutenticado,
  HASH_SENHA_INEXISTENTE,
  limparSessao,
  revogarSessoesDoUsuario,
  validarPermissaoAdmin,
  validarSenha,
  type AdminRole,
} from "@/lib/auth";
import { enviarEmailRecuperacaoSenha } from "@/lib/email";
import { dentroDoLimite, ipDaRequisicao } from "@/lib/rateLimit";
import {
  SENHA_MAX,
  SENHA_MIN_PADRINHO,
  idValido,
  minimoSenhaPorTipo,
  sha256Hex,
  validarDadosUsuario,
  validarPoliticaSenha,
} from "@/lib/seguranca";
import { revalidatePath } from "next/cache";
import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";

interface UsuarioIdRow extends RowDataPacket {
  id: number;
}

interface UsuarioResetRow extends RowDataPacket {
  id: number;
  tipo: "admin" | "padrinho";
}

const MSG_MUITAS_TENTATIVAS = "Muitas tentativas. Aguarde alguns minutos e tente de novo.";
const TIPOS_USUARIO = ["admin", "padrinho"] as const;
const PAPEIS_ADMIN = ["master", "full", "editor"] as const;

interface UsuarioLoginRow extends RowDataPacket {
  id: number;
  senha: string;
  tipo: "admin" | "padrinho";
}

interface TentativaLoginRow extends RowDataPacket {
  tentativas_falhas: number;
  bloqueado_ate: Date | null;
}

interface UsuarioSenhaRow extends RowDataPacket {
  senha: string;
}

interface UsuarioPermissaoRow extends RowDataPacket {
  id: number;
  tipo: "admin" | "padrinho";
  admin_role: AdminRole | null;
}

interface ContagemRow extends RowDataPacket {
  total: number;
}

export interface AuthActionState {
  success: boolean;
  message: string;
  redirectTo?: string;
}

interface CadastroInput {
  nome: string;
  telefone: string;
  email: string;
  senha: string;
}

interface LoginInput {
  email: string;
  senha: string;
}

interface CadastroAdminInput {
  nome: string;
  telefone: string;
  email: string;
  senha: string;
  tipo: "admin" | "padrinho";
  admin_role: "master" | "full" | "editor" | null;
}

export async function cadastrarUsuario(
  input: CadastroInput,
): Promise<AuthActionState> {
  const nome = input.nome.trim();
  const telefone = input.telefone.trim();
  const email = input.email.trim().toLowerCase();
  const senha = String(input.senha ?? "");

  const erroValidacao =
    validarDadosUsuario({ nome, telefone, email }) ??
    validarPoliticaSenha(senha, { min: SENHA_MIN_PADRINHO, email });
  if (erroValidacao) {
    return { success: false, message: erroValidacao };
  }

  if (!(await dentroDoLimite(`cadastro:ip:${await ipDaRequisicao()}`, 40, 60 * 60))) {
    return { success: false, message: MSG_MUITAS_TENTATIVAS };
  }

  try {
    const [existentes] = await db.query<UsuarioIdRow[]>(
      "SELECT id FROM usuarios WHERE email = ? LIMIT 1",
      [email],
    );

    if (existentes?.length) {
      return { success: false, message: "Já existe um cadastro com esse e-mail." };
    }

    const senhaHash = gerarHashSenha(senha);
    const [resultado] = await db.query<ResultSetHeader>(
      "INSERT INTO usuarios (nome, telefone, email, senha, tipo) VALUES (?, ?, ?, ?, 'padrinho')",
      [nome, telefone, email, senhaHash],
    );

    await criarSessao(resultado.insertId);
    revalidatePath("/");

    return { success: true, message: "Cadastro realizado com sucesso." };
  } catch (error) {
    console.error("Erro ao cadastrar usuário:", error);
    return { success: false, message: "Não foi possível concluir o cadastro." };
  }
}

export async function loginUsuario(input: LoginInput): Promise<AuthActionState> {
  const email = String(input.email ?? "").trim().toLowerCase();
  const senha = String(input.senha ?? "");

  // Limita o tamanho antes de rodar o scrypt (evita gastar CPU com entrada gigante).
  if (!email || email.length > 100 || !senha || senha.length > SENHA_MAX) {
    return { success: false, message: "E-mail ou senha inválidos." };
  }

  // Além do bloqueio por e-mail (abaixo), limita por IP: cobre quem testa a mesma
  // senha em vários e-mails.
  if (!(await dentroDoLimite(`login:ip:${await ipDaRequisicao()}`, 60, 15 * 60))) {
    return { success: false, message: MSG_MUITAS_TENTATIVAS };
  }

  try {
    // Rastreado por e-mail digitado, não pelo id do usuário — ver calcularBloqueioAposFalha em lib/auth.ts.
    const [tentativaRows] = await db.query<TentativaLoginRow[]>(
      "SELECT tentativas_falhas, bloqueado_ate FROM login_tentativas WHERE email = ? LIMIT 1",
      [email],
    );

    const tentativa = tentativaRows?.[0];
    const agora = new Date();
    const bloqueadoAte = tentativa?.bloqueado_ate ? new Date(tentativa.bloqueado_ate) : null;

    if (bloqueadoAte && bloqueadoAte > agora) {
      const minutosRestantes = Math.ceil((bloqueadoAte.getTime() - agora.getTime()) / 60000);
      return {
        success: false,
        message: `Muitas tentativas de login. Tente novamente em ${minutosRestantes} minuto(s).`,
      };
    }

    const [rows] = await db.query<UsuarioLoginRow[]>(
      "SELECT id, senha, tipo FROM usuarios WHERE email = ? LIMIT 1",
      [email],
    );

    const usuario = rows?.[0];

    // Roda mesmo com e-mail inexistente (contra HASH_SENHA_INEXISTENTE) pra não vazar por timing.
    const senhaValida = validarSenha(senha, usuario?.senha ?? HASH_SENHA_INEXISTENTE);

    if (!usuario || !senhaValida) {
      const novoEstado = calcularBloqueioAposFalha(
        tentativa?.tentativas_falhas ?? 0,
        bloqueadoAte,
        agora,
      );
      await db.query(
        `INSERT INTO login_tentativas (email, tentativas_falhas, bloqueado_ate)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE tentativas_falhas = VALUES(tentativas_falhas), bloqueado_ate = VALUES(bloqueado_ate)`,
        [email, novoEstado.tentativas, novoEstado.bloqueadoAte],
      );
      return { success: false, message: "E-mail ou senha inválidos." };
    }

    if (tentativa) {
      await db.query("DELETE FROM login_tentativas WHERE email = ?", [email]);
    }

    await criarSessao(usuario.id);
    revalidatePath("/");

    return {
      success: true,
      message: "Login realizado com sucesso.",
      redirectTo: usuario.tipo === "admin" ? "/admin" : "/usuario",
    };
  } catch (error) {
    console.error("Erro ao fazer login:", error);
    return { success: false, message: "Não foi possível fazer login." };
  }
}

export async function logoutUsuario(): Promise<void> {
  await limparSessao();
  revalidatePath("/");
}

export async function buscarUsuarioAutenticado() {
  return getUsuarioAutenticado();
}

export async function cadastrarUsuarioAdmin(
  input: CadastroAdminInput,
): Promise<AuthActionState> {
  const permissao = await validarPermissaoAdmin("users");
  if (!permissao.ok) {
    return { success: false, message: permissao.message };
  }

  const nome = input.nome.trim();
  const telefone = input.telefone.trim();
  const email = input.email.trim().toLowerCase();
  const senha = String(input.senha ?? "");
  const tipo = input.tipo;

  if (!TIPOS_USUARIO.includes(tipo)) {
    return { success: false, message: "Tipo de usuário inválido." };
  }
  if (tipo === "admin" && !PAPEIS_ADMIN.includes(input.admin_role as (typeof PAPEIS_ADMIN)[number])) {
    return { success: false, message: "Escolha o nível de acesso do administrador." };
  }
  const adminRole = tipo === "admin" ? input.admin_role : null;

  const erroValidacao =
    validarDadosUsuario({ nome, telefone, email }) ??
    validarPoliticaSenha(senha, { min: minimoSenhaPorTipo(tipo), email });
  if (erroValidacao) {
    return { success: false, message: erroValidacao };
  }

  if (tipo === "admin" && !adminRole) {
    return {
      success: false,
      message: "Escolha o nível de acesso do administrador.",
    };
  }

  try {
    const [existentes] = await db.query<UsuarioIdRow[]>(
      "SELECT id FROM usuarios WHERE email = ? LIMIT 1",
      [email],
    );

    if (existentes?.length) {
      return { success: false, message: "Já existe um cadastro com esse e-mail." };
    }

    const senhaHash = gerarHashSenha(senha);
    await db.query(
      "INSERT INTO usuarios (nome, telefone, email, senha, tipo, admin_role) VALUES (?, ?, ?, ?, ?, ?)",
      [nome, telefone, email, senhaHash, tipo, adminRole],
    );

    revalidatePath("/admin");
    return { success: true, message: "Usuário cadastrado com sucesso." };
  } catch (error) {
    console.error("Erro ao cadastrar usuário pelo admin:", error);
    return { success: false, message: "Não foi possível cadastrar o usuário." };
  }
}

export async function solicitarRecuperacaoSenha(
  email: string,
): Promise<AuthActionState> {
  // Mensagem genérica para não revelar se o e-mail existe no sistema
  const MENSAGEM_PADRAO =
    "Se este e-mail estiver cadastrado, você receberá as instruções em instantes.";

  const emailNormalizado = String(email ?? "").trim().toLowerCase();
  if (!emailNormalizado || emailNormalizado.length > 100) {
    return { success: false, message: "Informe um e-mail válido." };
  }

  // Cada pedido dispara um e-mail (custo no Resend): limita por IP e por destinatário.
  // No limite por e-mail a resposta continua igual, pra não revelar nada.
  if (!(await dentroDoLimite(`recuperacao:ip:${await ipDaRequisicao()}`, 10, 60 * 60))) {
    return { success: false, message: MSG_MUITAS_TENTATIVAS };
  }
  if (!(await dentroDoLimite(`recuperacao:email:${emailNormalizado}`, 3, 60 * 60))) {
    return { success: true, message: MENSAGEM_PADRAO };
  }

  try {
    const [rows] = await db.query<UsuarioIdRow[]>(
      "SELECT id FROM usuarios WHERE email = ? LIMIT 1",
      [emailNormalizado],
    );

    if (!rows?.length) {
      return { success: true, message: MENSAGEM_PADRAO };
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    // No banco fica só o hash; o token em si só existe no link enviado por e-mail.
    await db.query(
      "UPDATE usuarios SET reset_token = ?, reset_token_expiry = ? WHERE id = ?",
      [sha256Hex(token), expiry, rows[0].id],
    );

    const baseUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";
    const linkRedefinicao = `${baseUrl}/redefinir-senha?token=${token}`;

    // Disparo não-bloqueante — falha no e-mail não impede a resposta
    enviarEmailRecuperacaoSenha({ email: emailNormalizado, linkRedefinicao }).catch(
      (err) => console.error("Falha no e-mail de recuperação:", err),
    );

    return { success: true, message: MENSAGEM_PADRAO };
  } catch (err) {
    console.error("Erro ao solicitar recuperação de senha:", err);
    return { success: true, message: MENSAGEM_PADRAO };
  }
}

export async function redefinirSenha(
  token: string,
  novaSenha: string,
): Promise<AuthActionState> {
  if (!token || typeof token !== "string" || token.length > 200) {
    return { success: false, message: "Link inválido. Solicite um novo." };
  }
  novaSenha = String(novaSenha ?? "");
  const erroSenha = validarPoliticaSenha(novaSenha, { min: SENHA_MIN_PADRINHO });
  if (erroSenha) {
    return { success: false, message: erroSenha };
  }

  if (!(await dentroDoLimite(`redefinir:ip:${await ipDaRequisicao()}`, 20, 60 * 60))) {
    return { success: false, message: MSG_MUITAS_TENTATIVAS };
  }

  try {
    const [rows] = await db.query<UsuarioResetRow[]>(
      `SELECT id, tipo FROM usuarios
       WHERE reset_token = ? AND reset_token_expiry > NOW()
       LIMIT 1`,
      [sha256Hex(token)],
    );

    if (!rows?.length) {
      return {
        success: false,
        message: "Link inválido ou expirado. Solicite uma nova redefinição.",
      };
    }

    const erroSenhaTipo = validarPoliticaSenha(novaSenha, { min: minimoSenhaPorTipo(rows[0].tipo) });
    if (erroSenhaTipo) {
      return { success: false, message: erroSenhaTipo };
    }

    const novoHash = gerarHashSenha(novaSenha);
    await db.query(
      "UPDATE usuarios SET senha = ?, reset_token = NULL, reset_token_expiry = NULL WHERE id = ?",
      [novoHash, rows[0].id],
    );
    // Quem redefine a senha geralmente perdeu o controle dela: derruba todas as sessões.
    await revogarSessoesDoUsuario(rows[0].id);

    return {
      success: true,
      message: "Senha redefinida com sucesso! Faça login com sua nova senha. Se você usa o app instalado no celular, volte a ele e entre por lá.",
    };
  } catch (err) {
    console.error("Erro ao redefinir senha:", err);
    return { success: false, message: "Não foi possível redefinir a senha. Tente novamente." };
  }
}

export async function atualizarPerfil(input: {
  nome: string;
  telefone: string;
  email: string;
  senhaAtual?: string;
  novaSenha?: string;
}): Promise<AuthActionState> {
  const usuario = await getUsuarioAutenticado();
  if (!usuario) {
    return { success: false, message: "Você precisa estar logado." };
  }

  const nome = String(input.nome ?? "").trim();
  const telefone = String(input.telefone ?? "").trim();
  const email = String(input.email ?? "").trim().toLowerCase();

  const erroDados = validarDadosUsuario({ nome, telefone, email });
  if (erroDados) {
    return { success: false, message: erroDados };
  }

  // Trocar o e-mail muda pra onde vai a recuperação de senha: exige a senha atual,
  // pra uma sessão esquecida aberta não virar tomada da conta.
  if (email !== usuario.email) {
    if (!input.senhaAtual) {
      return { success: false, message: "Informe sua senha atual para alterar o e-mail." };
    }
    const [linhaSenha] = await db.query<UsuarioSenhaRow[]>(
      "SELECT senha FROM usuarios WHERE id = ? LIMIT 1",
      [usuario.id],
    );
    const hashAtual = linhaSenha?.[0]?.senha;
    if (
      !(await dentroDoLimite(`senha-atual:${usuario.id}`, 10, 15 * 60)) ||
      !hashAtual ||
      input.senhaAtual.length > SENHA_MAX ||
      !validarSenha(input.senhaAtual, hashAtual)
    ) {
      return { success: false, message: "Senha atual incorreta." };
    }
  }

  // Verifica se o novo e-mail já está em uso por outro usuário
  if (email !== usuario.email) {
    const [existentes] = await db.query<UsuarioIdRow[]>(
      "SELECT id FROM usuarios WHERE email = ? AND id <> ? LIMIT 1",
      [email, usuario.id],
    );
    if (existentes?.length) {
      return { success: false, message: "Este e-mail já está em uso por outra conta." };
    }
  }

  // Troca de senha — só executa se o usuário preencheu os campos
  let novoHash: string | null = null;
  if (input.novaSenha) {
    if (!input.senhaAtual) {
      return { success: false, message: "Informe sua senha atual para alterá-la." };
    }
    const [rows] = await db.query<UsuarioSenhaRow[]>(
      "SELECT senha FROM usuarios WHERE id = ? LIMIT 1",
      [usuario.id],
    );
    const senhaArmazenada = rows?.[0]?.senha;
    if (
      !(await dentroDoLimite(`senha-atual:${usuario.id}`, 10, 15 * 60)) ||
      !senhaArmazenada ||
      input.senhaAtual.length > SENHA_MAX ||
      !validarSenha(input.senhaAtual, senhaArmazenada)
    ) {
      return { success: false, message: "Senha atual incorreta." };
    }
    const erroNovaSenha = validarPoliticaSenha(input.novaSenha, {
      min: minimoSenhaPorTipo(usuario.tipo),
      email,
    });
    if (erroNovaSenha) {
      return { success: false, message: erroNovaSenha };
    }
    novoHash = gerarHashSenha(input.novaSenha);
  }

  try {
    if (novoHash) {
      await db.query(
        "UPDATE usuarios SET nome = ?, telefone = ?, email = ?, senha = ? WHERE id = ?",
        [nome, telefone, email, novoHash, usuario.id],
      );
      // Mantém só a sessão de quem trocou a senha; as outras (ex.: outro aparelho) caem.
      await revogarSessoesDoUsuario(usuario.id, true);
    } else {
      await db.query(
        "UPDATE usuarios SET nome = ?, telefone = ?, email = ? WHERE id = ?",
        [nome, telefone, email, usuario.id],
      );
    }

    revalidatePath("/usuario");
    return {
      success: true,
      message: novoHash ? "Dados e senha atualizados com sucesso!" : "Dados atualizados com sucesso!",
    };
  } catch (err) {
    console.error("Erro ao atualizar perfil:", err);
    return { success: false, message: "Não foi possível salvar as alterações." };
  }
}

export async function excluirConta(): Promise<AuthActionState> {
  const usuario = await getUsuarioAutenticado();
  if (!usuario) {
    return { success: false, message: "Você precisa estar logado." };
  }

  if (usuario.tipo === "admin") {
    return {
      success: false,
      message: "Contas de administrador não podem ser excluídas por aqui. Entre em contato com a equipe.",
    };
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [emAndamento] = await conn.query<ContagemRow[]>(
      `SELECT COUNT(*) as total FROM cartinhas
       WHERE apadrinhado_por_usuario_id = ?
       AND status IN ('conferida', 'embrulhado', 'reapadrinhado')
       FOR UPDATE`,
      [usuario.id],
    );

    if ((emAndamento?.[0]?.total ?? 0) > 0) {
      await conn.rollback();
      return {
        success: false,
        message:
          "Você tem cartinhas em andamento (conferidas, embrulhadas ou em processo). Entre em contato com a equipe antes de excluir sua conta.",
      };
    }

    await conn.query(
      `INSERT INTO desistencias (cartinha_id, usuario_id, nome_padrinho, email_padrinho, nome_crianca, numero_sequencial)
       SELECT id, ?, ?, ?, nome_crianca, numero_sequencial
       FROM cartinhas
       WHERE apadrinhado_por_usuario_id = ? AND status = 'apadrinhada'`,
      [usuario.id, usuario.nome, usuario.email, usuario.id],
    );

    await conn.query(
      `UPDATE cartinhas
       SET status = 'carente', apadrinhado_por_usuario_id = NULL, data_apadrinamento = NULL
       WHERE apadrinhado_por_usuario_id = ? AND status = 'apadrinhada'`,
      [usuario.id],
    );

    // Cartinhas já entregues guardam quem apadrinhou (nome/e-mail) antes de soltar o
    // vínculo, pra não perder o registro de quem entregou quando a conta é apagada.
    await conn.query(
      `UPDATE cartinhas
       SET apadrinhado_por_usuario_id = NULL, nome_padrinho = ?, email_padrinho = ?
       WHERE apadrinhado_por_usuario_id = ? AND status = 'entregue'`,
      [usuario.nome, usuario.email, usuario.id],
    );

    // Demais cartinhas em aberto (ex: canceladas) só perdem o vínculo, sem snapshot.
    await conn.query(
      "UPDATE cartinhas SET apadrinhado_por_usuario_id = NULL WHERE apadrinhado_por_usuario_id = ? AND status != 'entregue'",
      [usuario.id],
    );

    try {
      await conn.query("DELETE FROM lembretes_enviados WHERE usuario_id = ?", [usuario.id]);
    } catch {
      // tabela pode não existir em ambientes antigos
    }

    await conn.query("DELETE FROM usuarios WHERE id = ?", [usuario.id]);
    await conn.commit();

    await limparSessao();
    revalidatePath("/");

    return { success: true, message: "Conta excluída com sucesso.", redirectTo: "/" };
  } catch (error) {
    await conn.rollback();
    console.error("Erro ao excluir conta:", error);
    return { success: false, message: "Não foi possível excluir sua conta. Tente novamente." };
  } finally {
    conn.release();
  }
}

export async function atualizarPermissoesUsuario(input: {
  usuarioId: number;
  tipo: "admin" | "padrinho";
  admin_role: "master" | "full" | "editor" | null;
}): Promise<AuthActionState> {
  const permissao = await validarPermissaoAdmin("users");
  if (!permissao.ok) {
    return { success: false, message: permissao.message };
  }

  const usuarioIdAlvo = idValido(input.usuarioId);
  if (usuarioIdAlvo === null || !TIPOS_USUARIO.includes(input.tipo)) {
    return { success: false, message: "Dados inválidos." };
  }
  input = { ...input, usuarioId: usuarioIdAlvo };

  const adminRole = input.tipo === "admin" ? input.admin_role : null;

  if (
    input.tipo === "admin" &&
    (!adminRole || !PAPEIS_ADMIN.includes(adminRole))
  ) {
    return {
      success: false,
      message: "Escolha o nível de acesso do administrador.",
    };
  }

  try {
    const [rows] = await db.query<UsuarioPermissaoRow[]>(
      "SELECT id, tipo, admin_role FROM usuarios WHERE id = ? LIMIT 1",
      [input.usuarioId],
    );

    const usuarioAtual = rows?.[0];

    if (!usuarioAtual) {
      return { success: false, message: "Usuário não encontrado." };
    }

    const vaiPerderAcessoAdmin =
      usuarioAtual.tipo === "admin" && input.tipo !== "admin";
    const vaiPerderNivelMaster =
      usuarioAtual.tipo === "admin" &&
      usuarioAtual.admin_role === "master" &&
      (input.tipo !== "admin" || adminRole !== "master");

    if (permissao.usuario.id === input.usuarioId && vaiPerderAcessoAdmin) {
      return {
        success: false,
        message: "Você não pode remover seu próprio acesso de administrador por aqui.",
      };
    }

    if (permissao.usuario.id === input.usuarioId && vaiPerderNivelMaster) {
      return {
        success: false,
        message: "Você não pode rebaixar seu próprio usuário de Super Adm.",
      };
    }

    if (vaiPerderNivelMaster) {
      const [masterAdmins] = await db.query<ContagemRow[]>(
        "SELECT COUNT(*) as total FROM usuarios WHERE tipo = 'admin' AND admin_role = 'master' AND id <> ?",
        [input.usuarioId],
      );

      if ((masterAdmins?.[0]?.total ?? 0) === 0) {
        return {
          success: false,
          message: "Precisa existir pelo menos um Super Adm no sistema.",
        };
      }
    }

    await db.query(
      "UPDATE usuarios SET tipo = ?, admin_role = ? WHERE id = ?",
      [input.tipo, adminRole, input.usuarioId],
    );

    revalidatePath("/admin");
    return { success: true, message: "Permissões atualizadas com sucesso." };
  } catch (error) {
    console.error("Erro ao atualizar permissões do usuário:", error);
    return {
      success: false,
      message: "Não foi possível atualizar as permissões.",
    };
  }
}
