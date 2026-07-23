"use client";

import { useState, useTransition } from "react";
import { atualizarPerfil } from "@/app/actions/auth";

interface Props {
  usuario: {
    nome: string;
    telefone: string;
    email: string;
  };
}

export default function FormularioEditarPerfil({ usuario }: Props) {
  const [aberto, setAberto] = useState(false);
  const [alterarSenha, setAlterarSenha] = useState(false);
  const [mensagem, setMensagem] = useState<{ tipo: "sucesso" | "erro"; texto: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);

    const input = {
      nome:       (data.get("nome")      as string).trim(),
      telefone:   (data.get("telefone")  as string).trim(),
      email:      (data.get("email")     as string).trim(),
      senhaAtual: (data.get("senhaAtual") as string) || undefined,
      novaSenha:  (data.get("novaSenha") as string) || undefined,
    };

    const confirmar = (data.get("confirmarSenha") as string) || "";
    if (input.novaSenha && input.novaSenha !== confirmar) {
      setMensagem({ tipo: "erro", texto: "A nova senha e a confirmação não coincidem." });
      return;
    }

    setMensagem(null);
    startTransition(async () => {
      const res = await atualizarPerfil(input);
      setMensagem({ tipo: res.success ? "sucesso" : "erro", texto: res.message });
      if (res.success) {
        setAlterarSenha(false);
        setTimeout(() => setAberto(false), 1500);
      }
    });
  }

  return (
    <div className="bg-white rounded-md border border-stone-200 overflow-hidden">
      <button
        type="button"
        onClick={() => {
          setAberto((v) => !v);
          setMensagem(null);
        }}
        className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-cream-deep transition-colors"
      >
        <span className="font-semibold text-sm text-stone-600">Editar meus dados</span>
        <span
          className={`shrink-0 flex items-center justify-center text-brand transition-all duration-300 ${
            aberto ? "rotate-180 text-brand-dark" : ""
          }`}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="w-4 h-4"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
          </svg>
        </span>
      </button>

      {aberto && (
        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-5 border-t border-stone-100 pt-5">

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[12.5px] font-medium text-stone-600 mb-1">
                Nome completo
              </label>
              <input
                name="nome"
                type="text"
                required
                defaultValue={usuario.nome}
                className="w-full rounded border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand"
              />
            </div>
            <div>
              <label className="block text-[12.5px] font-medium text-stone-600 mb-1">
                Telefone (WhatsApp)
              </label>
              <input
                name="telefone"
                type="tel"
                required
                defaultValue={usuario.telefone}
                className="w-full rounded border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand"
              />
            </div>
          </div>

          <div>
            <label className="block text-[12.5px] font-medium text-stone-600 mb-1">
              E-mail
            </label>
            <input
              name="email"
              type="email"
              required
              defaultValue={usuario.email}
              className="w-full rounded border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand"
            />
          </div>

          <div className="border-t border-stone-100 pt-4">
            <button
              type="button"
              onClick={() => setAlterarSenha((v) => !v)}
              className="text-[13px] text-brand-dark hover:underline font-medium"
            >
              {alterarSenha ? "Cancelar troca de senha" : "Alterar senha"}
            </button>
          </div>

          {alterarSenha && (
            <div className="space-y-4 rounded-md bg-cream-deep border border-stone-200 p-4">
              <div>
                <label className="block text-[12.5px] font-medium text-stone-600 mb-1">
                  Senha atual
                </label>
                <input
                  name="senhaAtual"
                  type="password"
                  autoComplete="current-password"
                  className="w-full rounded border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12.5px] font-medium text-stone-600 mb-1">
                    Nova senha
                  </label>
                  <input
                    name="novaSenha"
                    type="password"
                    autoComplete="new-password"
                    minLength={6}
                    className="w-full rounded border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand"
                  />
                </div>
                <div>
                  <label className="block text-[12.5px] font-medium text-stone-600 mb-1">
                    Confirmar nova senha
                  </label>
                  <input
                    name="confirmarSenha"
                    type="password"
                    autoComplete="new-password"
                    className="w-full rounded border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand"
                  />
                </div>
              </div>
              <p className="text-xs text-stone-400">Mínimo de 6 caracteres.</p>
            </div>
          )}

          {mensagem && (
            <div
              className={`rounded px-4 py-3 text-sm font-medium ${
                mensagem.tipo === "sucesso"
                  ? "bg-verde-natal/10 text-verde-natal border border-verde-natal/20"
                  : "bg-vermelho-natal/10 text-vermelho-natal border border-vermelho-natal/20"
              }`}
            >
              {mensagem.texto}
            </div>
          )}

          <div className="flex gap-3 justify-end pt-1">
            <button
              type="button"
              onClick={() => setAberto(false)}
              className="rounded border border-stone-300 px-4 py-2 text-sm font-medium text-stone-500 hover:bg-cream-deep transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded bg-ink border border-ink px-5 py-2 text-sm font-bold text-white hover:bg-white hover:text-ink transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? "Salvando..." : "Salvar alterações"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
