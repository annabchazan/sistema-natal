"use client";

export default function Paginacao({
  paginaAtual,
  totalPaginas,
  totalRegistros,
  onChange,
}: {
  paginaAtual: number;
  totalPaginas: number;
  totalRegistros: number;
  onChange: (pagina: number) => void;
}) {
  if (totalPaginas <= 1) return null;

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-stone-100 text-sm text-stone-500">
      <span>{totalRegistros} registros — Página {paginaAtual} de {totalPaginas}</span>
      <div className="flex gap-2">
        <button
          onClick={() => onChange(Math.max(1, paginaAtual - 1))}
          disabled={paginaAtual === 1}
          className="px-4 py-1.5 rounded border border-stone-300 hover:bg-cream-deep disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          Anterior
        </button>
        <button
          onClick={() => onChange(Math.min(totalPaginas, paginaAtual + 1))}
          disabled={paginaAtual === totalPaginas}
          className="px-4 py-1.5 rounded border border-stone-300 hover:bg-cream-deep disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          Próxima
        </button>
      </div>
    </div>
  );
}
