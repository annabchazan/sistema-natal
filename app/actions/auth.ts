"use server";

import db from "@/lib/db";
import {
  criarSessao,
  gerarHashSenha,
  getUsuarioAutenticado,
  limparSessao,
  validarPermissaoAdmin,
  validarSenha,
} from "@/lib/auth";
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
  admin_role: "full" | "editor" | null;
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
  const permissao = await validarPermissaoAdmin("manage");
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

export async function atualizarPermissoesUsuario(input: {
  usuarioId: number;
  tipo: "admin" | "padrinho";
  admin_role: "full" | "editor" | null;
}): Promise<AuthActionState> {
  const permissao = await validarPermissaoAdmin("manage");
  if (!permissao.ok) {
    return { success: false, message: permissao.message };
  }

  if (permissao.usuario.id === input.usuarioId && input.tipo !== "admin") {
    return {
      success: false,
      message: "Voce nao pode remover seu proprio acesso de administrador por aqui.",
    };
  }

  const adminRole = input.tipo === "admin" ? input.admin_role : null;

  if (input.tipo === "admin" && !adminRole) {
    return {
      success: false,
      message: "Escolha o nivel de acesso do administrador.",
    };
  }

  try {
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
