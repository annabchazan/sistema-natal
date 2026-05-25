"use client";

import { useTransition } from "react";
import { cancelarApadrinamento } from "@/app/actions/cartinhas";

export default function BotaoCancelarApadrinamento({ cartinhaId }: { cartinhaId: number }) {
  const [isPending, startTransition] = useTransition();

  function handleCancelar() {
    if (!confirm("Tem certeza que deseja cancelar este apadrinhamento? A cartinha voltará para a lista e poderá ser apadrinhada por outra pessoa.")) return;
    startTransition(async () => {
      const res = await cancelarApadrinamento(cartinhaId);
      if (!res.success) alert(res.message);
    });
  }

  return (
    <button
      onClick={handleCancelar}
      disabled={isPending}
      className="text-xs text-red-500 hover:text-red-700 hover:underline disabled:opacity-50 transition-colors"
    >
      {isPending ? "Cancelando..." : "Cancelar apadrinhamento"}
    </button>
  );
}
