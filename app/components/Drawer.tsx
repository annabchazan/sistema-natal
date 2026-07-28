"use client";

import { useEffect } from "react";

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  side?: "left" | "right";
  title?: string;
  children: React.ReactNode;
}

export default function Drawer({
  isOpen,
  onClose,
  side = "left",
  title,
  children,
}: DrawerProps) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    const overflowOriginal = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = overflowOriginal;
    };
  }, [isOpen, onClose]);

  const posicao = side === "left" ? "left-0" : "right-0";
  const translacaoFechado = side === "left" ? "-translate-x-full" : "translate-x-full";

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/40 z-50 transition-opacity duration-200 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`fixed top-0 ${posicao} h-full w-72 max-w-[85vw] bg-white z-60 shadow-[0_0_32px_rgba(30,27,23,.15)] transition-transform duration-200 ease-out flex flex-col ${
          isOpen ? "translate-x-0" : translacaoFechado
        }`}
      >
        {title && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-stone-200 shrink-0">
            <h2 className="text-sm font-bold text-ink">{title}</h2>
            <button
              onClick={onClose}
              className="text-stone-400 hover:text-ink"
              aria-label="Fechar menu"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                className="w-5 h-5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </>
  );
}
