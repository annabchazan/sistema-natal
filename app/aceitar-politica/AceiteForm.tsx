"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { aceitarPolitica, logoutUsuario } from "@/app/actions/auth";

export default function AceiteForm({ destino }: { destino: string }) {
  const router = useRouter();
  const [aceitou, setAceitou] = useState(false);
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!aceitou) {
      setErro("Marque a caixa para concordar com a Política de Privacidade.");
      return;
    }
    setSalvando(true);
    const resultado = await aceitarPolitica({ aceitouPolitica: aceitou });
    if (!resultado.success) {
      setErro(resultado.message);
      setSalvando(false);
      return;
    }
    router.push(destino);
    router.refresh();
  };

  const handleSair = async () => {
    await logoutUsuario();
    router.push("/");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="px-8 pt-7 pb-8 space-y-5">
      <label className="flex items-start gap-2.5 text-[13px] text-stone-600 cursor-pointer">
        <input
          type="checkbox"
          checked={aceitou}
          onChange={(event) => {
            setErro("");
            setAceitou(event.target.checked);
          }}
          className="mt-0.5 h-4 w-4 shrink-0 accent-brand-dark"
        />
        <span>
          Li e concordo com a{" "}
          <Link
            href="/politica-de-privacidade"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-brand-dark underline"
          >
            Política de Privacidade
          </Link>
        </span>
      </label>

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
        {salvando ? "Salvando..." : "Aceitar e continuar"}
      </button>

      <p className="text-center text-[13px] text-stone-500">
        Não quer aceitar agora?{" "}
        <button type="button" onClick={handleSair} className="font-semibold text-brand-dark hover:underline">
          Sair
        </button>
      </p>
    </form>
  );
}
