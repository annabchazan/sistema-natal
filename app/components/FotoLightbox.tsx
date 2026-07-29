"use client";

import { useEffect } from "react";
import Image from "next/image";

interface FotoLightboxProps {
  src: string | null;
  alt: string;
  onClose: () => void;
}

export default function FotoLightbox({ src, alt, onClose }: FotoLightboxProps) {
  const isOpen = src !== null;

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

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      className="fixed inset-0 bg-black/80 z-[70] flex items-center justify-center p-4 sm:p-8"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white/80 hover:text-white"
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

      <div
        className="relative w-full h-full max-w-3xl max-h-[85vh]"
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
