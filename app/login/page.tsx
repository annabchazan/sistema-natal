"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { loginUsuario } from "@/app/actions/auth";
import { emailValido } from "@/app/utils/usuarioCadastro";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErro("");

    if (!emailValido(email)) {
      setErro("Informe um e-mail valido.");
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
      router.push("/usuario");
      router.refresh();
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-green-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-xl border border-red-100 overflow-hidden">
          <div className="bg-red-600 text-white p-8">
            <h1 className="text-3xl font-bold">Entrar</h1>
            <p className="mt-2 text-red-100">
              Acesse sua conta para acompanhar seus dados e apadrinhamentos.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="voce@exemplo.com"
                autoComplete="email"
              />
            </div>

            <div>
              <label htmlFor="senha" className="block text-sm font-semibold text-gray-700 mb-2">
                Senha
              </label>
              <input
                id="senha"
                type="password"
                value={senha}
                onChange={(event) => setSenha(event.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Digite sua senha"
                autoComplete="current-password"
              />
            </div>

            {erro && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {erro}
              </div>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="w-full rounded-lg bg-green-600 px-4 py-3 text-lg font-bold text-white transition-colors hover:bg-green-700 disabled:bg-gray-400"
            >
              {isPending ? "Entrando..." : "Entrar"}
            </button>

            <p className="text-center text-sm text-gray-600">
              Ainda nao tem conta?{" "}
              <Link href="/cadastro" className="font-semibold text-red-700 hover:text-red-800">
                Criar cadastro
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
