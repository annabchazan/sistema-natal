"use client";

import { useRouter } from "next/navigation";

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

  return (
    <select
      value={abaAtiva}
      onChange={(event) => router.push(`/admin?tab=${event.target.value}`)}
      className="md:hidden w-full mb-6 p-3 border border-stone-300 rounded-md bg-white text-sm font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand"
      aria-label="Navegar entre abas do painel"
    >
      {abas.map((aba) => (
        <option key={aba.id} value={aba.id}>
          {aba.label}
        </option>
      ))}
    </select>
  );
}
