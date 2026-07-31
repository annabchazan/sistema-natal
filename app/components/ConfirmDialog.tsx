"use client";

import { useEffect } from "react";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "default";
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  variant = "default",
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isLoading) onCancel();
    };

    document.addEventListener("keydown", handleKeyDown);
    const overflowOriginal = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = overflowOriginal;
    };
  }, [isOpen, isLoading, onCancel]);

  if (!isOpen) return null;

  const corConfirmar =
    variant === "danger"
      ? "bg-vermelho-natal border-vermelho-natal hover:bg-white hover:text-vermelho-natal"
      : "bg-ink border-ink hover:bg-white hover:text-ink";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={() => !isLoading && onCancel()}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-sm bg-white rounded-md border border-stone-200 shadow-[0_16px_48px_rgba(30,27,23,.18)] p-6 animate-fade-in"
      >
        <h2 id="confirm-dialog-title" className="text-base font-bold text-ink">
          {title}
        </h2>
        <p className="mt-2 text-sm text-stone-500 leading-relaxed">{message}</p>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 rounded border border-stone-300 text-stone-600 text-sm font-semibold hover:bg-cream-deep transition-colors disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 rounded border text-sm font-semibold text-white transition-colors disabled:opacity-50 ${corConfirmar}`}
          >
            {isLoading ? "Aguarde..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
