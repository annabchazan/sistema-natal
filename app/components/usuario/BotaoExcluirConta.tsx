"use client";

import { useTransition } from "react";
import { excluirConta } from "@/app/actions/auth";

export default function BotaoExcluirConta() {
  const [isPending, startTransition] = useTransition();

  function handleExcluir() {
    if (
      !confirm(
        "Tem certeza que deseja excluir sua conta?\n\nEsta ação é permanente e não pode ser desfeita. Seus dados serão removidos do sistema.",
      )
    )
      return;

    startTransition(async () => {
      const res = await excluirConta();
      if (res.success) {
        window.location.href = "/";
      } else {
        alert(res.message);
      }
    });
  }

  return (
    <button
      onClick={handleExcluir}
      disabled={isPending}
      className="text-sm text-vermelho-natal hover:underline disabled:opacity-50 transition-colors"
    >
      {isPending ? "Excluindo..." : "Excluir minha conta"}
    </button>
  );
}
