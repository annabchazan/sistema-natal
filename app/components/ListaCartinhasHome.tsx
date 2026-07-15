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
}: {
  cartinhas: Cartinha[];
  tags: Tag[];
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
    <div className="w-full min-h-screen bg-linear-to-br from-orange-50 to-amber-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-center text-brand mb-2">
          Cartinhas de Natal
        </h1>
        <p className="text-center text-gray-600 mb-8">
          {cartinhas.length} {cartinhas.length === 1 ? "cartinha" : "cartinhas"}{" "}
          encontrada{cartinhas.length === 1 ? "" : "s"}
        </p>

        {/* Filtros */}
        <div className="bg-white rounded-[25px] shadow-md p-6 mb-8 border-l-4 border-brand">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            Filtrar Cartinhas
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoria (Tag)
              </label>
              <select
                value={filtroTag}
                onChange={(e) => setFiltroTag(e.target.value)}
                className="w-full p-2 border rounded-full bg-white focus:outline-none focus:ring-2 focus:ring-brand"
              >
                <option value="">Todas as categorias</option>
                {tags.map((tag) => (
                  <option key={tag.id} value={tag.id}>
                    {tag.nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Idade Mínima
              </label>
              <input
                type="number"
                value={filtroIdadeMin}
                onChange={(e) => setFiltroIdadeMin(e.target.value)}
                placeholder="Ex: 5"
                min="0"
                max="18"
                className="w-full p-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-brand"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Idade Máxima
              </label>
              <input
                type="number"
                value={filtroIdadeMax}
                onChange={(e) => setFiltroIdadeMax(e.target.value)}
                placeholder="Ex: 12"
                min="0"
                max="18"
                className="w-full p-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-brand"
              />
            </div>

            <div className="flex gap-2 items-end">
              <button
                onClick={aplicarFiltros}
                disabled={isFiltering}
                className="flex-1 bg-brand text-white border border-brand px-4 py-2 rounded-full font-semibold hover:bg-white hover:text-brand transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isFiltering ? "Filtrando..." : "Filtrar"}
              </button>
              <button
                onClick={limparFiltros}
                className="flex-1 bg-white text-gray-600 border border-gray-300 px-4 py-2 rounded-full font-semibold hover:bg-gray-50 transition-colors"
              >
                Limpar
              </button>
            </div>
          </div>
        </div>

        {cartinhas.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-xl text-gray-500">
              Nenhuma cartinha encontrada com os filtros aplicados.
            </p>
            <button
              onClick={limparFiltros}
              className="mt-4 bg-brand text-white border border-brand px-6 py-2 rounded-full font-semibold hover:bg-white hover:text-brand transition-colors"
            >
              Ver todas as cartinhas
            </button>
          </div>
        ) : (
          <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cartinhas.slice((paginaAtual - 1) * ITENS_POR_PAGINA, paginaAtual * ITENS_POR_PAGINA).map((cartinha) => (
              <div
                key={cartinha.id}
                className="bg-white rounded-[25px] shadow-lg hover:shadow-xl transition-shadow p-6 border-l-4 border-brand relative"
              >
                {cartinha.numero_sequencial !== undefined && (
                  <div className="absolute top-3 right-3 bg-brand text-white rounded-full w-10 h-10 flex items-center justify-center font-bold text-lg">
                    #{cartinha.numero_sequencial}
                  </div>
                )}

                {cartinha.foto_cartinha && (
                  <div className="mb-4 flex justify-center">
                    <Image
                      src={cartinha.foto_cartinha}
                      alt={`Foto da cartinha de ${cartinha.nome_crianca}`}
                      width={128}
                      height={96}
                      className="rounded-2xl object-cover border-4 border-orange-100 shadow-md"
                    />
                  </div>
                )}

                <div className="mb-4">
                  <h2 className="text-2xl font-bold text-brand mb-2">
                    {cartinha.nome_crianca}
                  </h2>
                  <p className="text-sm text-gray-500">
                    <span className="font-semibold">Idade:</span>{" "}
                    {cartinha.idade} anos
                  </p>
                  {cartinha.tag_nome && (
                    <p className="text-sm text-blue-600 mt-1">
                      <span className="font-semibold">Categoria:</span>{" "}
                      {cartinha.tag_nome}
                    </p>
                  )}
                  {cartinha.data_limite_entrega && (
                    <p className="text-sm text-orange-600 mt-1">
                      <span className="font-semibold">Entregar até:</span>{" "}
                      {new Date(
                        cartinha.data_limite_entrega,
                      ).toLocaleDateString("pt-BR")}
                    </p>
                  )}
                </div>

                <div className="mb-4">
                  <p className="text-gray-700 line-clamp-3">
                    <span className="font-semibold block mb-1">Mensagem:</span>
                    {cartinha.texto_cartinha}
                  </p>
                </div>

                <div className="bg-orange-50 p-3 rounded-2xl mb-4">
                  <p className="text-orange-800">
                    <span className="font-semibold">Presente desejado:</span>
                    <br />
                    {cartinha.presente_pedido}
                  </p>
                </div>

                <button
                  onClick={() => handleApadrinhar(cartinha)}
                  className={`w-full py-2 px-4 rounded-full font-semibold border transition-all ${
                    carrinhoAtualizado[cartinha.id]
                      ? "bg-green-600 border-green-600 text-white hover:bg-white hover:text-green-600"
                      : "bg-brand border-brand text-white hover:bg-white hover:text-brand"
                  }`}
                >
                  {carrinhoAtualizado[cartinha.id]
                    ? "Apadrinhada"
                    : "Apadrinhar"}
                </button>
              </div>
            ))}
          </div>

          {cartinhas.length > ITENS_POR_PAGINA && (
            <div className="flex items-center justify-center gap-4 mt-10">
              <button
                onClick={() => setPaginaAtual((p) => Math.max(1, p - 1))}
                disabled={paginaAtual === 1}
                className="px-5 py-2 rounded-full border border-brand text-brand font-semibold hover:bg-brand hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              <span className="text-gray-600 text-sm">
                Página {paginaAtual} de {Math.ceil(cartinhas.length / ITENS_POR_PAGINA)}
              </span>
              <button
                onClick={() => setPaginaAtual((p) => Math.min(Math.ceil(cartinhas.length / ITENS_POR_PAGINA), p + 1))}
                disabled={paginaAtual === Math.ceil(cartinhas.length / ITENS_POR_PAGINA)}
                className="px-5 py-2 rounded-full border border-brand text-brand font-semibold hover:bg-brand hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
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
