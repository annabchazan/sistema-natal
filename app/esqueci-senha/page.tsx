"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { solicitarRecuperacaoSenha } from "@/app/actions/auth";

export default function EsqueciSenhaPage() {
  const [email, setEmail] = useState("");
  const [resultado, setResultado] = useState<{ tipo: "sucesso" | "erro"; texto: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setResultado(null);
    startTransition(async () => {
      const res = await solicitarRecuperacaoSenha(email);
      setResultado({ tipo: res.success ? "sucesso" : "erro", texto: res.message });
    });
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-green-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl border border-red-100 overflow-hidden">

          <div className="bg-red-600 text-white p-8">
            <h1 className="text-2xl font-bold">Esqueci minha senha</h1>
            <p className="mt-2 text-red-100 text-sm">
              Informe seu e-mail e enviaremos um link para criar uma nova senha.
            </p>
          </div>

          <div className="p-8">
            {resultado?.tipo === "sucesso" ? (
              <div className="space-y-6 text-center">
                <div className="text-5xl">📬</div>
                <p className="text-gray-700 font-medium">{resultado.texto}</p>
                <p className="text-sm text-gray-500">
                  Verifique sua caixa de entrada e a pasta de spam.
                  O link expira em <strong>1 hora</strong>.
                </p>
                <Link
                  href="/login"
                  className="inline-block rounded-lg bg-red-600 px-6 py-3 font-semibold text-white hover:bg-red-700 transition-colors"
                >
                  Voltar para o login
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    E-mail cadastrado
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="voce@exemplo.com"
                    autoComplete="email"
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                {resultado?.tipo === "erro" && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                    {resultado.texto}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full rounded-lg bg-red-600 px-4 py-3 font-bold text-white hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {isPending ? "Enviando..." : "Enviar link de redefinição"}
                </button>

                <p className="text-center text-sm text-gray-500">
                  Lembrou a senha?{" "}
                  <Link href="/login" className="font-semibold text-red-700 hover:text-red-800">
                    Voltar para o login
                  </Link>
                </p>
              </form>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
