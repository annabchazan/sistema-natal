"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  emailValido,
  formatarTelefoneCelular,
  telefoneEhCelular,
} from "@/app/utils/usuarioCadastro";
import { cadastrarUsuario } from "@/app/actions/auth";

interface FormularioCadastro {
  nome: string;
  telefone: string;
  email: string;
  senha: string;
  confirmarSenha: string;
}

function IconeUsuario() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4.5 h-4.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
  );
}

function IconeTelefone() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4.5 h-4.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h1.5a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
    </svg>
  );
}

function IconeEmail() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4.5 h-4.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
    </svg>
  );
}

function IconeCadeado() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4.5 h-4.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
    </svg>
  );
}

function IconeOlho() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4.5 h-4.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
  );
}

function IconeOlhoFechado() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4.5 h-4.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
    </svg>
  );
}

const classeInput =
  "w-full rounded border border-stone-300 pl-10 pr-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand";
const classeInputSenha =
  "w-full rounded border border-stone-300 pl-10 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand";
const classeIconeCampo =
  "pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400";

export default function CadastroPage() {
  const router = useRouter();
  const [formulario, setFormulario] = useState<FormularioCadastro>({
    nome: "",
    telefone: "",
    email: "",
    senha: "",
    confirmarSenha: "",
  });
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false);

  const handleChange = (campo: keyof FormularioCadastro, valor: string) => {
    setErro("");

    setFormulario((prev) => ({
      ...prev,
      [campo]: campo === "telefone" ? formatarTelefoneCelular(valor) : valor,
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSalvando(true);

    const nome = formulario.nome.trim();
    const telefone = formulario.telefone.trim();
    const email = formulario.email.trim().toLowerCase();
    const senha = formulario.senha;
    const confirmarSenha = formulario.confirmarSenha;

    if (nome.length < 3) {
      setErro("Informe um nome completo com pelo menos 3 caracteres.");
      setSalvando(false);
      return;
    }

    if (!telefoneEhCelular(telefone)) {
      setErro(
        "Informe um celular válido com DDD. Telefones fixos não são aceitos.",
      );
      setSalvando(false);
      return;
    }

    if (!emailValido(email)) {
      setErro("Informe um e-mail válido.");
      setSalvando(false);
      return;
    }

    if (senha.length < 6) {
      setErro("A senha deve ter pelo menos 6 caracteres.");
      setSalvando(false);
      return;
    }

    if (senha !== confirmarSenha) {
      setErro("A confirmação de senha não confere.");
      setSalvando(false);
      return;
    }

    const resultado = await cadastrarUsuario({ nome, telefone, email, senha });

    if (!resultado.success) {
      setErro(resultado.message);
      setSalvando(false);
      return;
    }

    window.dispatchEvent(new Event("auth-changed"));
    router.push("/usuario");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-cream py-14 flex justify-center">
      <div className="container mx-auto px-4">
        <div className="max-w-120 mx-auto bg-white border border-stone-200 border-t-[3px] border-t-brand rounded-md overflow-hidden">
          <div className="px-8 pt-8 pb-6 border-b border-stone-100">
            <h1 className="text-[19px] font-bold text-ink">Criar sua conta</h1>
            <p className="mt-1 text-[13px] text-stone-400">
              Preencha seus dados para acessar sua área no Natal Solidário.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="px-8 pt-7 pb-8 space-y-5">
            <div>
              <label
                htmlFor="nome"
                className="block text-[12.5px] font-semibold text-stone-600 mb-1.5"
              >
                Nome completo
              </label>
              <div className="relative">
                <span className={classeIconeCampo}>
                  <IconeUsuario />
                </span>
                <input
                  id="nome"
                  type="text"
                  value={formulario.nome}
                  onChange={(event) => handleChange("nome", event.target.value)}
                  className={classeInput}
                  placeholder="Digite seu nome completo"
                  autoComplete="name"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="telefone"
                className="block text-[12.5px] font-semibold text-stone-600 mb-1.5"
              >
                Celular
              </label>
              <div className="relative">
                <span className={classeIconeCampo}>
                  <IconeTelefone />
                </span>
                <input
                  id="telefone"
                  type="tel"
                  value={formulario.telefone}
                  onChange={(event) =>
                    handleChange("telefone", event.target.value)
                  }
                  className={classeInput}
                  placeholder="(11) 91234-5678"
                  autoComplete="tel"
                />
              </div>
              <p className="mt-1.5 text-xs text-stone-400">
                Aceitamos apenas celular com DDD e nono dígito.
              </p>
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-[12.5px] font-semibold text-stone-600 mb-1.5"
              >
                E-mail
              </label>
              <div className="relative">
                <span className={classeIconeCampo}>
                  <IconeEmail />
                </span>
                <input
                  id="email"
                  type="email"
                  value={formulario.email}
                  onChange={(event) => handleChange("email", event.target.value)}
                  className={classeInput}
                  placeholder="voce@exemplo.com"
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="senha"
                className="block text-[12.5px] font-semibold text-stone-600 mb-1.5"
              >
                Senha
              </label>
              <div className="relative">
                <span className={classeIconeCampo}>
                  <IconeCadeado />
                </span>
                <input
                  id="senha"
                  type={mostrarSenha ? "text" : "password"}
                  value={formulario.senha}
                  onChange={(event) => handleChange("senha", event.target.value)}
                  className={classeInputSenha}
                  placeholder="Crie uma senha"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-ink transition-colors"
                  aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                >
                  {mostrarSenha ? <IconeOlhoFechado /> : <IconeOlho />}
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor="confirmarSenha"
                className="block text-[12.5px] font-semibold text-stone-600 mb-1.5"
              >
                Confirmar senha
              </label>
              <div className="relative">
                <span className={classeIconeCampo}>
                  <IconeCadeado />
                </span>
                <input
                  id="confirmarSenha"
                  type={mostrarConfirmarSenha ? "text" : "password"}
                  value={formulario.confirmarSenha}
                  onChange={(event) =>
                    handleChange("confirmarSenha", event.target.value)
                  }
                  className={classeInputSenha}
                  placeholder="Repita sua senha"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setMostrarConfirmarSenha((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-ink transition-colors"
                  aria-label={
                    mostrarConfirmarSenha ? "Ocultar senha" : "Mostrar senha"
                  }
                >
                  {mostrarConfirmarSenha ? <IconeOlhoFechado /> : <IconeOlho />}
                </button>
              </div>
            </div>

            {erro && (
              <div className="rounded border border-vermelho-natal/20 bg-vermelho-natal/5 px-4 py-3 text-sm font-medium text-vermelho-natal">
                {erro}
              </div>
            )}

            <button
              type="submit"
              disabled={salvando}
              className="w-full rounded bg-ink border border-ink px-4 py-3 text-[14.5px] font-bold text-white transition-colors hover:bg-white hover:text-ink disabled:opacity-50"
            >
              {salvando ? "Salvando..." : "Salvar cadastro"}
            </button>

            <p className="text-center text-[13px] text-stone-500">
              Já tem conta?{" "}
              <Link
                href="/login"
                className="font-semibold text-brand-dark hover:underline"
              >
                Entrar
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
