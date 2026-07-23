"use client";

import Link from "next/link";
import { Suspense, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { loginUsuario } from "@/app/actions/auth";
import { emailValido } from "@/app/utils/usuarioCadastro";

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

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [isPending, startTransition] = useTransition();
  const [mostrarSenha, setMostrarSenha] = useState(false);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErro("");

    if (!emailValido(email)) {
      setErro("Informe um e-mail válido.");
      return;
    }

    if (senha.length < 6) {
      setErro("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    startTransition(async () => {
      const resultado = await loginUsuario({ email, senha });

      if (!resultado.success) {
        setErro(resultado.message);
        return;
      }

      window.dispatchEvent(new Event("auth-changed"));
      const next = searchParams.get("next");
      router.push(next || resultado.redirectTo || "/usuario");
      router.refresh();
    });
  };

  return (
    <div className="min-h-screen bg-cream py-14 flex justify-center">
      <div className="container mx-auto px-4">
        <div className="max-w-110 mx-auto bg-white border border-stone-200 border-t-[3px] border-t-brand rounded-md overflow-hidden">
          <div className="px-8 pt-8 pb-6 border-b border-stone-100">
            <h1 className="text-[19px] font-bold text-ink">Entrar na sua conta</h1>
            <p className="mt-1 text-[13px] text-stone-400">
              Acompanhe seus apadrinhamentos
            </p>
          </div>

          <form onSubmit={handleSubmit} className="px-8 pt-7 pb-8 space-y-5">
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
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
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
                  value={senha}
                  onChange={(event) => setSenha(event.target.value)}
                  className={classeInputSenha}
                  placeholder="Digite sua senha"
                  autoComplete="current-password"
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

            {erro && (
              <div className="rounded border border-vermelho-natal/20 bg-vermelho-natal/5 px-4 py-3 text-sm font-medium text-vermelho-natal">
                {erro}
              </div>
            )}

            <div className="text-right -mt-2">
              <Link
                href="/esqueci-senha"
                className="text-[13px] text-stone-500 hover:text-ink hover:underline"
              >
                Esqueci minha senha
              </Link>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full rounded bg-ink border border-ink px-4 py-3 text-[14.5px] font-bold text-white transition-colors hover:bg-white hover:text-ink disabled:opacity-50"
            >
              {isPending ? "Entrando..." : "Entrar"}
            </button>

            <p className="text-center text-[13px] text-stone-500">
              Não tem conta?{" "}
              <Link
                href="/cadastro"
                className="font-semibold text-brand-dark hover:underline"
              >
                Cadastre-se
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
