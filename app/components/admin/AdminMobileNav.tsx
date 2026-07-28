"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Drawer from "@/app/components/Drawer";

interface Aba {
  id: string;
  label: string;
}

export default function AdminMobileNav({
  abas,
  abaAtiva,
}: {
  abas: Aba[];
  abaAtiva: string;
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const labelAtiva = abas.find((aba) => aba.id === abaAtiva)?.label ?? "Menu";

  return (
    <div className="md:hidden mb-6">
      <button
        onClick={() => setIsOpen(true)}
        className="w-full flex items-center justify-between p-3 border border-stone-300 rounded-md bg-white text-sm font-semibold text-ink"
        aria-label="Abrir menu de navegação do painel"
      >
        <span>{labelAtiva}</span>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          className="w-4 h-4 text-stone-400"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
        </svg>
      </button>

      <Drawer isOpen={isOpen} onClose={() => setIsOpen(false)} title="Navegação" side="left">
        <nav className="p-2">
          {abas.map((aba) => (
            <button
              key={aba.id}
              onClick={() => {
                setIsOpen(false);
                router.push(`/admin?tab=${aba.id}`);
              }}
              className={`w-full text-left flex items-center gap-3 p-3 rounded text-sm transition-colors ${
                abaAtiva === aba.id
                  ? "bg-brand/10 text-brand-dark font-semibold"
                  : "text-stone-500 hover:bg-cream-deep"
              }`}
            >
              {aba.label}
            </button>
          ))}
        </nav>
      </Drawer>
    </div>
  );
}
