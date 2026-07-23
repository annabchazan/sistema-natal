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
    <div className="min-h-screen bg-cream py-14">
      <div className="container mx-auto px-4">
        <div className="max-w-[440px] mx-auto bg-white border border-stone-200 rounded-md overflow-hidden">

          <div className="px-8 pt-8 pb-6 border-b border-stone-100">
            <h1 className="text-[19px] font-bold text-ink">Esqueci minha senha</h1>
            <p className="mt-1 text-[13px] text-stone-400">
              Informe seu e-mail e enviaremos um link para criar uma nova senha.
            </p>
          </div>

          <div className="px-8 pt-7 pb-8">
            {resultado?.tipo === "sucesso" ? (
              <div className="space-y-5 text-center">
                <div className="text-4xl text-brand">✓</div>
                <p className="text-ink font-medium text-sm">{resultado.texto}</p>
                <p className="text-[13px] text-stone-400">
                  Verifique sua caixa de entrada e a pasta de spam.
                  O link expira em <strong>1 hora</strong>.
                </p>
                <Link
                  href="/login"
                  className="inline-block rounded bg-ink border border-ink px-6 py-3 font-semibold text-sm text-white hover:bg-white hover:text-ink transition-colors"
                >
                  Voltar para o login
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-[12.5px] font-semibold text-stone-600 mb-1.5">
                    E-mail cadastrado
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="voce@exemplo.com"
                    autoComplete="email"
                    className="w-full rounded border border-stone-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand"
                  />
                </div>

                {resultado?.tipo === "erro" && (
                  <div className="rounded border border-vermelho-natal/20 bg-vermelho-natal/5 px-4 py-3 text-sm font-medium text-vermelho-natal">
                    {resultado.texto}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full rounded bg-ink border border-ink px-4 py-3 text-sm font-bold text-white hover:bg-white hover:text-ink transition-colors disabled:opacity-50"
                >
                  {isPending ? "Enviando..." : "Enviar link de redefinição"}
                </button>

                <p className="text-center text-[13px] text-stone-500">
                  Lembrou a senha?{" "}
                  <Link href="/login" className="font-semibold text-brand-dark hover:underline">
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
