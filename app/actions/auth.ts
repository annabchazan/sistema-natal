"use server";

import db from "@/lib/db";
import {
  criarSessao,
  gerarHashSenha,
  getUsuarioAutenticado,
  limparSessao,
  validarSenha,
} from "@/lib/auth";
import { revalidatePath } from "next/cache";

export interface AuthActionState {
  success: boolean;
  message: string;
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
      "SELECT id, senha FROM usuarios WHERE email = ? LIMIT 1",
      [email],
    );

    const usuario = rows?.[0];

    if (!usuario || !validarSenha(senha, usuario.senha)) {
      return { success: false, message: "E-mail ou senha invalidos." };
    }

    await criarSessao(usuario.id);
    revalidatePath("/");

    return { success: true, message: "Login realizado com sucesso." };
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
