"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { redefinirSenha } from "@/app/actions/auth";

export default function RedefinirSenhaPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";

  const [novaSenha, setNovaSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [resultado, setResultado] = useState<{ tipo: "sucesso" | "erro"; texto: string } | null>(
    () =>
      token
        ? null
        : { tipo: "erro", texto: "Link inválido. Solicite uma nova redefinição de senha." },
  );
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (novaSenha !== confirmar) {
      setResultado({ tipo: "erro", texto: "As senhas não coincidem." });
      return;
    }
    setResultado(null);
    startTransition(async () => {
      const res = await redefinirSenha(token, novaSenha);
      setResultado({ tipo: res.success ? "sucesso" : "erro", texto: res.message });
      if (res.success) {
        setTimeout(() => router.push("/login"), 2500);
      }
    });
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-amber-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-md mx-auto bg-white rounded-[25px] shadow-xl border border-brand/20 overflow-hidden">

          <div className="bg-brand text-white p-8">
            <h1 className="text-2xl font-bold">Nova senha</h1>
            <p className="mt-2 text-white/80 text-sm">
              Escolha uma senha segura com pelo menos 6 caracteres.
            </p>
          </div>

          <div className="p-8">
            {resultado?.tipo === "sucesso" ? (
              <div className="space-y-6 text-center">
                <div className="text-5xl text-green-600">✓</div>
                <p className="text-gray-700 font-medium">{resultado.texto}</p>
                <p className="text-sm text-gray-500">
                  Redirecionando para o login...
                </p>
                <Link
                  href="/login"
                  className="inline-block rounded-full bg-brand border border-brand px-6 py-3 font-semibold text-white hover:bg-white hover:text-brand transition-colors"
                >
                  Ir para o login
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nova senha
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={novaSenha}
                    onChange={(e) => setNovaSenha(e.target.value)}
                    autoComplete="new-password"
                    placeholder="Mínimo 6 caracteres"
                    disabled={!token}
                    className="w-full rounded-full border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand disabled:bg-gray-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Confirmar nova senha
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={confirmar}
                    onChange={(e) => setConfirmar(e.target.value)}
                    autoComplete="new-password"
                    placeholder="Repita a senha"
                    disabled={!token}
                    className="w-full rounded-full border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand disabled:bg-gray-50"
                  />
                </div>

                {resultado?.tipo === "erro" && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                    {resultado.texto}
                    {resultado.texto.includes("inválido") && (
                      <span>
                        {" "}
                        <Link href="/esqueci-senha" className="underline">
                          Solicitar novo link
                        </Link>
                      </span>
                    )}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isPending || !token}
                  className="w-full rounded-full bg-brand border border-brand px-4 py-3 font-bold text-white hover:bg-white hover:text-brand transition-colors disabled:opacity-50"
                >
                  {isPending ? "Salvando..." : "Redefinir senha"}
                </button>
              </form>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
