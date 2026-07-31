"use client";

import { useState, useTransition } from "react";
import { cancelarApadrinamento } from "@/app/actions/cartinhas";
import ConfirmDialog from "@/app/components/ConfirmDialog";
import { useToast } from "@/app/components/Toast";

export default function BotaoCancelarApadrinamento({ cartinhaId }: { cartinhaId: number }) {
  const [isPending, startTransition] = useTransition();
  const [mostrarConfirmacao, setMostrarConfirmacao] = useState(false);
  const { mostrarToast } = useToast();

  function handleConfirmar() {
    startTransition(async () => {
      const res = await cancelarApadrinamento(cartinhaId);
      setMostrarConfirmacao(false);
      mostrarToast(res.message, res.success ? "sucesso" : "erro");
    });
  }

  return (
    <>
      <button
        onClick={() => setMostrarConfirmacao(true)}
        disabled={isPending}
        className="text-xs text-vermelho-natal hover:underline disabled:opacity-50 transition-colors"
      >
        {isPending ? "Cancelando..." : "Cancelar apadrinhamento"}
      </button>

      <ConfirmDialog
        isOpen={mostrarConfirmacao}
        title="Cancelar apadrinhamento?"
        message="A cartinha voltará para a lista e poderá ser apadrinhada por outra pessoa."
        confirmLabel="Sim, cancelar"
        cancelLabel="Voltar"
        variant="danger"
        isLoading={isPending}
        onConfirm={handleConfirmar}
        onCancel={() => setMostrarConfirmacao(false)}
      />
    </>
  );
}
