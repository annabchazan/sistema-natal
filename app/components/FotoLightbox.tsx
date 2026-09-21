"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

interface FotoLightboxProps {
  src: string | null;
  alt: string;
  onClose: () => void;
}

export default function FotoLightbox({ src, alt, onClose }: FotoLightboxProps) {
  const isOpen = src !== null;
  const [rotacao, setRotacao] = useState(0);

  const fechar = () => {
    setRotacao(0);
    onClose();
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") fechar();
    };

    document.addEventListener("keydown", handleKeyDown);
    const overflowOriginal = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = overflowOriginal;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      className="fixed inset-0 bg-black/80 z-[70] flex items-center justify-center p-4 sm:p-8"
      onClick={fechar}
    >
      <div className="absolute top-4 right-4 flex items-center gap-4">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setRotacao((atual) => (atual + 90) % 360);
          }}
          className="text-white/80 hover:text-white"
          aria-label="Girar foto 90 graus"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            className="w-7 h-7"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12a7.5 7.5 0 1 1 2.5 5.6M4.5 12V7m0 5h5" />
          </svg>
        </button>
        <button
          onClick={fechar}
          className="text-white/80 hover:text-white"
          aria-label="Fechar foto"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            className="w-7 h-7"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div
        className="relative w-full h-full max-w-3xl max-h-[85vh] transition-transform duration-300"
        style={{ transform: `rotate(${rotacao}deg)` }}
        onClick={(e) => e.stopPropagation()}
      >
        <Image
          src={src as string}
          alt={alt}
          fill
          className="object-contain"
          sizes="100vw"
        />
      </div>
    </div>
  );
}
