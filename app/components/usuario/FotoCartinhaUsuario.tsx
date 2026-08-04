"use client";

import { useState } from "react";
import Image from "next/image";
import FotoLightbox from "@/app/components/FotoLightbox";

interface FotoCartinhaUsuarioProps {
  src: string;
  nomeCrianca: string;
}

export default function FotoCartinhaUsuario({ src, nomeCrianca }: FotoCartinhaUsuarioProps) {
  const [aberta, setAberta] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setAberta(true)}
        className="relative w-16 h-16 rounded overflow-hidden flex-shrink-0 group cursor-zoom-in"
        aria-label={`Ver foto da cartinha de ${nomeCrianca} em tela cheia`}
      >
        <Image
          src={src}
          alt={nomeCrianca}
          width={64}
          height={64}
          className="w-16 h-16 rounded object-cover"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
        <div className="absolute bottom-1 right-1 bg-black/50 text-white rounded-full p-1 z-10">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            className="w-2.5 h-2.5"
          >
            <circle cx="11" cy="11" r="7" />
            <path strokeLinecap="round" d="m20 20-3.5-3.5M11 8v6M8 11h6" />
          </svg>
        </div>
      </button>

      <FotoLightbox
        src={aberta ? src : null}
        alt={`Foto da cartinha de ${nomeCrianca}`}
        onClose={() => setAberta(false)}
      />
    </>
  );
}
