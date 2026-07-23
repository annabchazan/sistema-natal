"use client";

import Link from "next/link";
import { Suspense, useState, useTransition } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { redefinirSenha } from "@/app/actions/auth";

export default function RedefinirSenhaPage() {
  return (
    <Suspense fallback={null}>
      <RedefinirSenhaForm />
    </Suspense>
  );
}

function RedefinirSenhaForm() {
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
    <div className="min-h-screen bg-cream py-14">
      <div className="container mx-auto px-4">
        <div className="max-w-[440px] mx-auto bg-white border border-stone-200 rounded-md overflow-hidden">

          <div className="px-8 pt-8 pb-6 border-b border-stone-100">
            <h1 className="text-[19px] font-bold text-ink">Nova senha</h1>
            <p className="mt-1 text-[13px] text-stone-400">
              Escolha uma senha segura com pelo menos 6 caracteres.
            </p>
          </div>

          <div className="px-8 pt-7 pb-8">
            {resultado?.tipo === "sucesso" ? (
              <div className="space-y-5 text-center">
                <div className="text-4xl text-verde-natal">✓</div>
                <p className="text-ink font-medium text-sm">{resultado.texto}</p>
                <p className="text-[13px] text-stone-400">
                  Redirecionando para o login...
                </p>
                <Link
                  href="/login"
                  className="inline-block rounded bg-ink border border-ink px-6 py-3 font-semibold text-sm text-white hover:bg-white hover:text-ink transition-colors"
                >
                  Ir para o login
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-[12.5px] font-semibold text-stone-600 mb-1.5">
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
                    className="w-full rounded border border-stone-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand disabled:bg-cream-deep"
                  />
                </div>

                <div>
                  <label className="block text-[12.5px] font-semibold text-stone-600 mb-1.5">
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
                    className="w-full rounded border border-stone-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand disabled:bg-cream-deep"
                  />
                </div>

                {resultado?.tipo === "erro" && (
                  <div className="rounded border border-vermelho-natal/20 bg-vermelho-natal/5 px-4 py-3 text-sm font-medium text-vermelho-natal">
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
                  className="w-full rounded bg-ink border border-ink px-4 py-3 text-sm font-bold text-white hover:bg-white hover:text-ink transition-colors disabled:opacity-50"
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
