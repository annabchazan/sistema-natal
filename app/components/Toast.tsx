"use client";

import { createContext, useCallback, useContext, useState } from "react";

type TipoToast = "sucesso" | "erro" | "info";

interface ToastItem {
  id: number;
  mensagem: string;
  tipo: TipoToast;
  saindo: boolean;
}

interface ToastContextValue {
  mostrarToast: (mensagem: string, tipo?: TipoToast) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const DURACAO_VISIVEL_MS = 4000;
const DURACAO_SAIDA_MS = 200;

const ESTILO_TIPO: Record<TipoToast, { borda: string; icone: React.ReactNode; iconeCor: string }> = {
  sucesso: {
    borda: "border-l-verde-natal",
    iconeCor: "text-verde-natal",
    icone: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="m5 13 4 4L19 7" />
      </svg>
    ),
  },
  erro: {
    borda: "border-l-vermelho-natal",
    iconeCor: "text-vermelho-natal",
    icone: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
        <circle cx="12" cy="12" r="9" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v5m0 3h.01" />
      </svg>
    ),
  },
  info: {
    borda: "border-l-stone-400",
    iconeCor: "text-stone-500",
    icone: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
        <circle cx="12" cy="12" r="9" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 16v-5m0-3h.01" />
      </svg>
    ),
  },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removerToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const mostrarToast = useCallback(
    (mensagem: string, tipo: TipoToast = "sucesso") => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { id, mensagem, tipo, saindo: false }]);

      setTimeout(() => {
        setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, saindo: true } : t)));
        setTimeout(() => removerToast(id), DURACAO_SAIDA_MS);
      }, DURACAO_VISIVEL_MS);
    },
    [removerToast],
  );

  return (
    <ToastContext.Provider value={{ mostrarToast }}>
      {children}

      <div className="fixed top-4 right-4 z-80 flex flex-col gap-2 w-[calc(100vw-2rem)] max-w-sm">
        {toasts.map((toast) => {
          const estilo = ESTILO_TIPO[toast.tipo];
          return (
            <div
              key={toast.id}
              role="status"
              className={`flex items-start gap-3 bg-white border border-stone-200 border-l-4 ${estilo.borda} rounded-md shadow-[0_8px_24px_rgba(30,27,23,.12)] p-4 transition-all duration-200 ${
                toast.saindo
                  ? "opacity-0 translate-x-2"
                  : "opacity-100 translate-x-0 animate-toast-in"
              }`}
            >
              <span className={`shrink-0 ${estilo.iconeCor}`}>{estilo.icone}</span>
              <p className="text-sm text-ink leading-snug">{toast.mensagem}</p>
              <button
                onClick={() => removerToast(toast.id)}
                className="ml-auto shrink-0 text-stone-500 hover:text-ink"
                aria-label="Fechar aviso"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast precisa ser usado dentro de um ToastProvider.");
  }
  return context;
}
