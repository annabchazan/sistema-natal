import { useState } from "react";

export function usePaginacao<T>(dados: T[], itensPorPagina = 20) {
  const [paginaAtual, setPaginaAtual] = useState(1);
  const totalPaginas = Math.max(1, Math.ceil(dados.length / itensPorPagina));
  const paginaSegura = Math.min(paginaAtual, totalPaginas);
  const dadosPaginados = dados.slice(
    (paginaSegura - 1) * itensPorPagina,
    paginaSegura * itensPorPagina,
  );

  return {
    paginaAtual: paginaSegura,
    setPaginaAtual,
    totalPaginas,
    dadosPaginados,
  };
}
