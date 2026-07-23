"use client";

import { useCarrinhoApadrinhamento } from "@/app/hooks/useCarrinhoApadrinhamento";
import { useState, useEffect } from "react";
import Image from "next/image";
import {
  listarCartinhasFiltradas,
  type FiltrosCartinhas,
} from "@/app/actions/cartinhas";

interface Cartinha {
  id: number;
  nome_crianca: string;
  idade: number;
  texto_cartinha: string;
  presente_pedido: string;
  instituicao_id: number;
  tag_id: number | null;
  numero_sequencial?: number;
  foto_cartinha?: string | null;
  data_limite_entrega?: string | null;
  tag_nome?: string | null;
}

interface Tag {
  id: number;
  nome: string;
}

export default function ListaCartinhasHome({
  cartinhas: cartinhasIniciais,
  tags,
  totalApadrinhadas = 0,
}: {
  cartinhas: Cartinha[];
  tags: Tag[];
  totalApadrinhadas?: number;
}) {
  const { adicionarCartinha, removerCartinha, temCartinha } =
    useCarrinhoApadrinhamento();
  const [carrinhoAtualizado, setCarrinhoAtualizado] = useState<{
    [key: number]: boolean;
  }>({});
  const [cartinhas, setCartinhas] = useState<Cartinha[]>(cartinhasIniciais);

  const [filtroTag, setFiltroTag] = useState<string>("");
  const [filtroIdadeMin, setFiltroIdadeMin] = useState<string>("");
  const [filtroIdadeMax, setFiltroIdadeMax] = useState<string>("");
  const [isFiltering, setIsFiltering] = useState(false);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const ITENS_POR_PAGINA = 12;

  useEffect(() => {
    const estado: { [key: number]: boolean } = {};
    cartinhas.forEach((c) => {
      estado[c.id] = temCartinha(c.id);
    });
    setCarrinhoAtualizado(estado);
  }, [cartinhas, temCartinha]);

  const aplicarFiltros = async () => {
    setIsFiltering(true);
    try {
      const filtros: FiltrosCartinhas = {};

      if (filtroTag)      filtros.tag_id    = parseInt(filtroTag);
      if (filtroIdadeMin) filtros.idade_min = parseInt(filtroIdadeMin);
      if (filtroIdadeMax) filtros.idade_max = parseInt(filtroIdadeMax);

      const temFiltros = filtroTag || filtroIdadeMin || filtroIdadeMax;
      const cartinhasFiltradas = temFiltros
        ? await listarCartinhasFiltradas(filtros)
        : cartinhasIniciais;

      setCartinhas(cartinhasFiltradas);
      setPaginaAtual(1);

      const estado: { [key: number]: boolean } = {};
      cartinhasFiltradas.forEach((c) => {
        estado[c.id] = temCartinha(c.id);
      });
      setCarrinhoAtualizado(estado);
    } catch (error) {
      console.error("Erro ao aplicar filtros:", error);
    } finally {
      setIsFiltering(false);
    }
  };

  const limparFiltros = async () => {
    setFiltroTag("");
    setFiltroIdadeMin("");
    setFiltroIdadeMax("");
    setCartinhas(cartinhasIniciais);
    setPaginaAtual(1);

    const estado: { [key: number]: boolean } = {};
    cartinhasIniciais.forEach((c) => {
      estado[c.id] = temCartinha(c.id);
    });
    setCarrinhoAtualizado(estado);
  };

  const handleApadrinhar = (cartinha: Cartinha) => {
    if (carrinhoAtualizado[cartinha.id]) {
      removerCartinha(cartinha.id);
      setCarrinhoAtualizado((prev) => ({
        ...prev,
        [cartinha.id]: false,
      }));
    } else {
      adicionarCartinha(cartinha);
      setCarrinhoAtualizado((prev) => ({
        ...prev,
        [cartinha.id]: true,
      }));
    }
  };

  return (
    <div className="w-full bg-cream">
      {/* Hero */}
      <div className="max-w-6xl mx-auto px-4 md:px-8 pt-14 pb-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_.9fr] gap-10 lg:gap-14 items-center">
          <div>
            <div className="text-[11px] font-bold tracking-[.14em] text-brand-dark uppercase mb-3">
              Campanha de Natal 2026
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-[44px] font-bold text-ink leading-[1.12] tracking-tight mb-4">
              Uma cartinha pode
              <br />
              mudar um Natal.
            </h1>
            <p className="text-[15px] text-stone-500 leading-7 max-w-md mb-7">
              Escolha uma criança, leve o presente até um ponto de entrega e
              acompanhe cada etapa até a entrega.
            </p>
            <div className="flex gap-8">
              <div>
                <div className="text-2xl font-bold text-ink">{cartinhas.length}</div>
                <div className="text-xs text-stone-400">aguardando padrinho</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-ink">{totalApadrinhadas}</div>
                <div className="text-xs text-stone-400">já apadrinhadas</div>
              </div>
            </div>
          </div>
          {/* Trocar por banner real da festa de Natal: salvar em public/banner-natal.jpg
              e substituir este bloco por <Image src="/banner-natal.jpg" alt="..." fill className="object-cover rounded-md" /> */}
          <div className="h-56 lg:h-80 rounded-md bg-[repeating-linear-gradient(135deg,#F0EAE0,#F0EAE0_12px,#E7DFD2_12px,#E7DFD2_24px)] flex items-center justify-center">
            <span className="text-xs text-stone-400 font-mono">banner da festa de Natal</span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-8 pb-16">
        {/* Filtros */}
        <div className="flex flex-wrap items-end gap-6 border-b border-stone-200 pb-5 mb-8">
          <div className="min-w-[180px]">
            <label className="block text-[11px] font-semibold text-stone-400 uppercase tracking-wide mb-1.5">
              Categoria
            </label>
            <select
              value={filtroTag}
              onChange={(e) => setFiltroTag(e.target.value)}
              className="w-full border-0 border-b-[1.5px] border-stone-300 bg-transparent py-1.5 text-sm text-ink focus:outline-none focus:border-ink"
            >
              <option value="">Todas as categorias</option>
              {tags.map((tag) => (
                <option key={tag.id} value={tag.id}>
                  {tag.nome}
                </option>
              ))}
            </select>
          </div>

          <div className="w-28">
            <label className="block text-[11px] font-semibold text-stone-400 uppercase tracking-wide mb-1.5">
              Idade mín.
            </label>
            <input
              type="number"
              value={filtroIdadeMin}
              onChange={(e) => setFiltroIdadeMin(e.target.value)}
              placeholder="0"
              min="0"
              max="18"
              className="w-full border-0 border-b-[1.5px] border-stone-300 bg-transparent py-1.5 text-sm text-ink focus:outline-none focus:border-ink"
            />
          </div>

          <div className="w-28">
            <label className="block text-[11px] font-semibold text-stone-400 uppercase tracking-wide mb-1.5">
              Idade máx.
            </label>
            <input
              type="number"
              value={filtroIdadeMax}
              onChange={(e) => setFiltroIdadeMax(e.target.value)}
              placeholder="12"
              min="0"
              max="18"
              className="w-full border-0 border-b-[1.5px] border-stone-300 bg-transparent py-1.5 text-sm text-ink focus:outline-none focus:border-ink"
            />
          </div>

          <button
            onClick={aplicarFiltros}
            disabled={isFiltering}
            className="bg-ink text-white border border-ink px-5 py-2 rounded font-semibold text-[13px] hover:bg-white hover:text-ink transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isFiltering ? "Filtrando..." : "Filtrar"}
          </button>
          <button
            onClick={limparFiltros}
            className="bg-transparent text-stone-500 border border-stone-300 px-5 py-2 rounded font-semibold text-[13px] hover:bg-cream-deep transition-colors"
          >
            Limpar
          </button>

          <div className="ml-auto text-[13px] text-stone-400 self-center">
            {cartinhas.length} {cartinhas.length === 1 ? "cartinha encontrada" : "cartinhas encontradas"}
          </div>
        </div>

        {cartinhas.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-lg text-stone-400">
              Nenhuma cartinha encontrada com os filtros aplicados.
            </p>
            <button
              onClick={limparFiltros}
              className="mt-4 bg-ink text-white border border-ink px-6 py-2 rounded font-semibold text-sm hover:bg-white hover:text-ink transition-colors"
            >
              Ver todas as cartinhas
            </button>
          </div>
        ) : (
          <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
            {cartinhas.slice((paginaAtual - 1) * ITENS_POR_PAGINA, paginaAtual * ITENS_POR_PAGINA).map((cartinha) => (
              <div
                key={cartinha.id}
                className="bg-white border border-stone-200 rounded-md overflow-hidden hover:shadow-[0_8px_24px_rgba(30,27,23,.08)] transition-shadow"
              >
                <div className="relative h-44 bg-[repeating-linear-gradient(135deg,#F0EAE0,#F0EAE0_10px,#E7DFD2_10px,#E7DFD2_20px)]">
                  {cartinha.numero_sequencial !== undefined && (
                    <div className="absolute top-3 left-3 bg-white text-ink text-[11.5px] font-bold rounded px-2.5 py-1">
                      Nº {cartinha.numero_sequencial}
                    </div>
                  )}
                  {cartinha.foto_cartinha && (
                    <Image
                      src={cartinha.foto_cartinha}
                      alt={`Foto da cartinha de ${cartinha.nome_crianca}`}
                      fill
                      className="object-cover"
                    />
                  )}
                </div>

                <div className="p-5">
                  {cartinha.tag_nome && (
                    <div className="text-[10.5px] font-bold text-brand-dark uppercase tracking-wide mb-1.5">
                      {cartinha.tag_nome}
                    </div>
                  )}
                  <div className="flex justify-between items-baseline mb-2.5">
                    <h2 className="text-[17px] font-bold text-ink">
                      {cartinha.nome_crianca}
                    </h2>
                    <span className="text-[13px] text-stone-400">
                      {cartinha.idade} anos
                    </span>
                  </div>
                  <p className="text-[13px] text-stone-500 leading-6 mb-3.5 line-clamp-3">
                    &quot;{cartinha.texto_cartinha}&quot;
                  </p>

                  <div className="flex justify-between text-[12.5px] mb-4 pt-3 border-t border-stone-100 gap-2">
                    <span className="text-stone-400">
                      Pedido: <strong className="text-stone-600">{cartinha.presente_pedido}</strong>
                    </span>
                    {cartinha.data_limite_entrega && (
                      <span className="text-stone-400 whitespace-nowrap">
                        Até {new Date(cartinha.data_limite_entrega).toLocaleDateString("pt-BR")}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => handleApadrinhar(cartinha)}
                    className={`w-full py-2.5 rounded font-semibold text-[13.5px] transition-colors flex items-center justify-center gap-1.5 ${
                      carrinhoAtualizado[cartinha.id]
                        ? "bg-brand/10 text-brand-dark border border-brand hover:bg-brand/20"
                        : "bg-brand text-white hover:bg-brand-dark"
                    }`}
                  >
                    {carrinhoAtualizado[cartinha.id] && (
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        className="w-4 h-4"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="m5 13 4 4L19 7"
                        />
                      </svg>
                    )}
                    {carrinhoAtualizado[cartinha.id]
                      ? "No carrinho"
                      : "Apadrinhar"}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {cartinhas.length > ITENS_POR_PAGINA && (
            <div className="flex items-center justify-center gap-1.5 mt-12">
              <button
                onClick={() => setPaginaAtual((p) => Math.max(1, p - 1))}
                disabled={paginaAtual === 1}
                className="px-4 h-9 rounded border border-stone-300 text-stone-600 font-semibold text-[13px] hover:bg-cream-deep transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              <span className="text-stone-400 text-[13px] mx-3">
                Página {paginaAtual} de {Math.ceil(cartinhas.length / ITENS_POR_PAGINA)}
              </span>
              <button
                onClick={() => setPaginaAtual((p) => Math.min(Math.ceil(cartinhas.length / ITENS_POR_PAGINA), p + 1))}
                disabled={paginaAtual === Math.ceil(cartinhas.length / ITENS_POR_PAGINA)}
                className="px-4 h-9 rounded border border-stone-300 text-stone-600 font-semibold text-[13px] hover:bg-cream-deep transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Próxima
              </button>
            </div>
          )}
          </>
        )}
      </div>
    </div>
  );
}
