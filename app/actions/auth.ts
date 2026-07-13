"use server";

import crypto from "crypto";
import db from "@/lib/db";
import {
  criarSessao,
  gerarHashSenha,
  getUsuarioAutenticado,
  limparSessao,
  validarPermissaoAdmin,
  validarSenha,
} from "@/lib/auth";
import { enviarEmailRecuperacaoSenha } from "@/lib/email";
import { revalidatePath } from "next/cache";

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
  const senha = input.senha;

  try {
    const [existentes]: any = await db.query(
      "SELECT id FROM usuarios WHERE email = ? LIMIT 1",
      [email],
    );

    if (existentes?.length) {
      return { success: false, message: "Ja existe um cadastro com esse e-mail." };
    }

    const senhaHash = gerarHashSenha(senha);
    const [resultado]: any = await db.query(
      "INSERT INTO usuarios (nome, telefone, email, senha, tipo) VALUES (?, ?, ?, ?, 'padrinho')",
      [nome, telefone, email, senhaHash],
    );

    await criarSessao(resultado.insertId);
    revalidatePath("/");

    return { success: true, message: "Cadastro realizado com sucesso." };
  } catch (error) {
    console.error("Erro ao cadastrar usuario:", error);
    return { success: false, message: "Nao foi possivel concluir o cadastro." };
  }
}

export async function loginUsuario(input: LoginInput): Promise<AuthActionState> {
  const email = input.email.trim().toLowerCase();
  const senha = input.senha;

  try {
    const [rows]: any = await db.query(
      "SELECT id, senha, tipo FROM usuarios WHERE email = ? LIMIT 1",
      [email],
    );

    const usuario = rows?.[0];

    if (!usuario || !validarSenha(senha, usuario.senha)) {
      return { success: false, message: "E-mail ou senha invalidos." };
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
    return { success: false, message: "Nao foi possivel fazer login." };
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
  const senha = input.senha;
  const tipo = input.tipo;
  const adminRole = tipo === "admin" ? input.admin_role : null;

  if (!nome || !telefone || !email || senha.length < 6) {
    return {
      success: false,
      message: "Preencha nome, telefone, email e uma senha com pelo menos 6 caracteres.",
    };
  }

  if (tipo === "admin" && !adminRole) {
    return {
      success: false,
      message: "Escolha o nivel de acesso do administrador.",
    };
  }

  try {
    const [existentes]: any = await db.query(
      "SELECT id FROM usuarios WHERE email = ? LIMIT 1",
      [email],
    );

    if (existentes?.length) {
      return { success: false, message: "Ja existe um cadastro com esse e-mail." };
    }

    const senhaHash = gerarHashSenha(senha);
    await db.query(
      "INSERT INTO usuarios (nome, telefone, email, senha, tipo, admin_role) VALUES (?, ?, ?, ?, ?, ?)",
      [nome, telefone, email, senhaHash, tipo, adminRole],
    );

    revalidatePath("/admin");
    return { success: true, message: "Usuario cadastrado com sucesso." };
  } catch (error) {
    console.error("Erro ao cadastrar usuario pelo admin:", error);
    return { success: false, message: "Nao foi possivel cadastrar o usuario." };
  }
}

export async function solicitarRecuperacaoSenha(
  email: string,
): Promise<AuthActionState> {
  // Mensagem genérica para não revelar se o e-mail existe no sistema
  const MENSAGEM_PADRAO =
    "Se este e-mail estiver cadastrado, você receberá as instruções em instantes.";

  const emailNormalizado = email.trim().toLowerCase();
  if (!emailNormalizado) {
    return { success: false, message: "Informe um e-mail válido." };
  }

  try {
    const [rows]: any = await db.query(
      "SELECT id FROM usuarios WHERE email = ? LIMIT 1",
      [emailNormalizado],
    );

    if (!rows?.length) {
      return { success: true, message: MENSAGEM_PADRAO };
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    await db.query(
      "UPDATE usuarios SET reset_token = ?, reset_token_expiry = ? WHERE id = ?",
      [token, expiry, rows[0].id],
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
  if (!token) {
    return { success: false, message: "Link inválido. Solicite um novo." };
  }
  if (novaSenha.length < 6) {
    return { success: false, message: "A senha deve ter pelo menos 6 caracteres." };
  }

  try {
    const [rows]: any = await db.query(
      `SELECT id FROM usuarios
       WHERE reset_token = ? AND reset_token_expiry > NOW()
       LIMIT 1`,
      [token],
    );

    if (!rows?.length) {
      return {
        success: false,
        message: "Link inválido ou expirado. Solicite uma nova redefinição.",
      };
    }

    const novoHash = gerarHashSenha(novaSenha);
    await db.query(
      "UPDATE usuarios SET senha = ?, reset_token = NULL, reset_token_expiry = NULL WHERE id = ?",
      [novoHash, rows[0].id],
    );

    return {
      success: true,
      message: "Senha redefinida com sucesso! Faça login com sua nova senha.",
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

  const nome = input.nome.trim();
  const telefone = input.telefone.trim();
  const email = input.email.trim().toLowerCase();

  if (!nome || !telefone || !email) {
    return { success: false, message: "Nome, telefone e e-mail são obrigatórios." };
  }

  // Verifica se o novo e-mail já está em uso por outro usuário
  if (email !== usuario.email) {
    const [existentes]: any = await db.query(
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
    const [rows]: any = await db.query(
      "SELECT senha FROM usuarios WHERE id = ? LIMIT 1",
      [usuario.id],
    );
    const senhaArmazenada = rows?.[0]?.senha;
    if (!senhaArmazenada || !validarSenha(input.senhaAtual, senhaArmazenada)) {
      return { success: false, message: "Senha atual incorreta." };
    }
    if (input.novaSenha.length < 6) {
      return { success: false, message: "A nova senha deve ter pelo menos 6 caracteres." };
    }
    novoHash = gerarHashSenha(input.novaSenha);
  }

  try {
    if (novoHash) {
      await db.query(
        "UPDATE usuarios SET nome = ?, telefone = ?, email = ?, senha = ? WHERE id = ?",
        [nome, telefone, email, novoHash, usuario.id],
      );
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

  try {
    const [emAndamento]: any = await db.query(
      `SELECT COUNT(*) as total FROM cartinhas
       WHERE apadrinhado_por_usuario_id = ?
       AND status IN ('conferida', 'embrulhado', 'carente', 'reapadrinhado')`,
      [usuario.id],
    );

    if ((emAndamento?.[0]?.total ?? 0) > 0) {
      return {
        success: false,
        message:
          "Você tem cartinhas em andamento (conferidas, embrulhadas ou em processo). Entre em contato com a equipe antes de excluir sua conta.",
      };
    }

    await db.query(
      `UPDATE cartinhas
       SET status = 'disponivel', apadrinhado_por_usuario_id = NULL, data_apadrinamento = NULL
       WHERE apadrinhado_por_usuario_id = ? AND status = 'apadrinhada'`,
      [usuario.id],
    );

    await db.query(
      "UPDATE cartinhas SET apadrinhado_por_usuario_id = NULL WHERE apadrinhado_por_usuario_id = ?",
      [usuario.id],
    );

    try {
      await db.query("DELETE FROM lembretes_enviados WHERE usuario_id = ?", [usuario.id]);
    } catch {
      // tabela pode não existir em ambientes antigos
    }

    await db.query("DELETE FROM usuarios WHERE id = ?", [usuario.id]);
    await limparSessao();
    revalidatePath("/");

    return { success: true, message: "Conta excluída com sucesso.", redirectTo: "/" };
  } catch (error) {
    console.error("Erro ao excluir conta:", error);
    return { success: false, message: "Não foi possível excluir sua conta. Tente novamente." };
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

  const adminRole = input.tipo === "admin" ? input.admin_role : null;

  if (input.tipo === "admin" && !adminRole) {
    return {
      success: false,
      message: "Escolha o nivel de acesso do administrador.",
    };
  }

  try {
    const [rows]: any = await db.query(
      "SELECT id, tipo, admin_role FROM usuarios WHERE id = ? LIMIT 1",
      [input.usuarioId],
    );

    const usuarioAtual = rows?.[0] as
      | {
          id: number;
          tipo: "admin" | "padrinho";
          admin_role: "master" | "full" | "editor" | null;
        }
      | undefined;

    if (!usuarioAtual) {
      return { success: false, message: "Usuario nao encontrado." };
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
        message: "Voce nao pode remover seu proprio acesso de administrador por aqui.",
      };
    }

    if (permissao.usuario.id === input.usuarioId && vaiPerderNivelMaster) {
      return {
        success: false,
        message: "Voce nao pode rebaixar seu proprio usuario de admin master.",
      };
    }

    if (vaiPerderNivelMaster) {
      const [masterAdmins]: any = await db.query(
        "SELECT COUNT(*) as total FROM usuarios WHERE tipo = 'admin' AND admin_role = 'master' AND id <> ?",
        [input.usuarioId],
      );

      if ((masterAdmins?.[0]?.total ?? 0) === 0) {
        return {
          success: false,
          message: "Precisa existir pelo menos um administrador master no sistema.",
        };
      }
    }

    await db.query(
      "UPDATE usuarios SET tipo = ?, admin_role = ? WHERE id = ?",
      [input.tipo, adminRole, input.usuarioId],
    );

    revalidatePath("/admin");
    return { success: true, message: "Permissoes atualizadas com sucesso." };
  } catch (error) {
    console.error("Erro ao atualizar permissoes do usuario:", error);
    return {
      success: false,
      message: "Nao foi possivel atualizar as permissoes.",
    };
  }
}
