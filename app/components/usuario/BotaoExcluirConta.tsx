"use client";

import { useTransition } from "react";
import { excluirConta } from "@/app/actions/auth";
import { useToast } from "@/app/components/Toast";

export default function BotaoExcluirConta() {
  const [isPending, startTransition] = useTransition();
  const { mostrarToast } = useToast();

  function handleExcluir() {
    if (
      !confirm(
        "Tem certeza que deseja excluir sua conta?\n\n" +
          "• Esta ação é permanente e não pode ser desfeita.\n" +
          "• As cartinhas que você apadrinhou e ainda não foram conferidas voltarão a ficar disponíveis para outros padrinhos. Se você ainda não entregou o presente, ele não será mais esperado.\n" +
          "• Seus dados pessoais serão removidos do sistema.",
      )
    )
      return;

    startTransition(async () => {
      const res = await excluirConta();
      if (res.success) {
        window.location.href = "/";
      } else {
        mostrarToast(res.message, "erro");
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
