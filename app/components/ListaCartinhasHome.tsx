"use client";

import { useCarrinhoApadrinhamento } from "@/app/hooks/useCarrinhoApadrinhamento";
import { useState, useEffect } from "react";
import {
  listarCartinhasFiltradas,
  listarCartinhas,
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
  const [isLoaded, setIsLoaded] = useState(false);
  const [cartinhas, setCartinhas] = useState<Cartinha[]>(cartinhasIniciais);

  // Estados dos filtros
  const [filtroTag, setFiltroTag] = useState<string>("");
  const [filtroIdadeMin, setFiltroIdadeMin] = useState<string>("");
  const [filtroIdadeMax, setFiltroIdadeMax] = useState<string>("");
  const [isFiltering, setIsFiltering] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
    // Atualizar o estado visual com base no carrinho
    const estado: { [key: number]: boolean } = {};
    cartinhas.forEach((c) => {
      estado[c.id] = temCartinha(c.id);
    });
    setCarrinhoAtualizado(estado);
  }, [cartinhas]); // Adicionado dependência para cartinhas

  // Função para aplicar filtros
  const aplicarFiltros = async () => {
    console.log("Aplicando filtros...");
    setIsFiltering(true);
    try {
      const filtros: any = {};

      if (filtroTag) {
        filtros.tag_id = parseInt(filtroTag);
        console.log("Filtro tag:", filtros.tag_id);
      }

      if (filtroIdadeMin) {
        filtros.idade_min = parseInt(filtroIdadeMin);
        console.log("Filtro idade min:", filtros.idade_min);
      }

      if (filtroIdadeMax) {
        filtros.idade_max = parseInt(filtroIdadeMax);
        console.log("Filtro idade max:", filtros.idade_max);
      }

      // Se não há filtros aplicados, usar a função normal
      const temFiltros = filtroTag || filtroIdadeMin || filtroIdadeMax;
      console.log("Tem filtros:", temFiltros);
      const cartinhasFiltradas = temFiltros
        ? await listarCartinhasFiltradas(filtros)
        : cartinhasIniciais;

      console.log("Cartinhas filtradas:", cartinhasFiltradas.length);
      setCartinhas(cartinhasFiltradas);

      // Atualizar estado do carrinho para as cartinhas filtradas
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

  // Função para limpar filtros
  const limparFiltros = async () => {
    setFiltroTag("");
    setFiltroIdadeMin("");
    setFiltroIdadeMax("");
    setCartinhas(cartinhasIniciais);

    // Resetar estado do carrinho
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
    <div className="w-full min-h-screen bg-linear-to-br from-red-50 to-green-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-center text-red-700 mb-2">
          🎄 Cartinhas de Natal 🎄
        </h1>
        <p className="text-center text-gray-600 mb-8">
          {cartinhas.length} {cartinhas.length === 1 ? "cartinha" : "cartinhas"}{" "}
          encontrada{cartinhas.length === 1 ? "" : "s"}
        </p>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8 border-l-4 border-green-500">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            🔍 Filtrar Cartinhas
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Filtro por Tag */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoria (Tag)
              </label>
              <select
                value={filtroTag}
                onChange={(e) => setFiltroTag(e.target.value)}
                className="w-full p-2 border rounded-md bg-white"
              >
                <option value="">Todas as categorias</option>
                {tags.map((tag) => (
                  <option key={tag.id} value={tag.id}>
                    {tag.nome}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro por Idade Mínima */}
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
                className="w-full p-2 border rounded-md"
              />
            </div>

            {/* Filtro por Idade Máxima */}
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
                className="w-full p-2 border rounded-md"
              />
            </div>

            {/* Botões de Ação */}
            <div className="flex gap-2 items-end">
              <button
                onClick={aplicarFiltros}
                disabled={isFiltering}
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isFiltering ? "🔄 Filtrando..." : "🔍 Filtrar"}
              </button>
              <button
                onClick={limparFiltros}
                className="flex-1 bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors"
              >
                🗑️ Limpar
              </button>
            </div>
          </div>
        </div>

        {cartinhas.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-xl text-gray-500">
              Nenhuma cartinha encontrada com os filtros aplicados 😢
            </p>
            <button
              onClick={limparFiltros}
              className="mt-4 bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Ver todas as cartinhas
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cartinhas.map((cartinha) => (
              <div
                key={cartinha.id}
                className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow p-6 border-l-4 border-red-500 relative"
              >
                {/* Badge do número sequencial */}
                {cartinha.numero_sequencial !== undefined && (
                  <div className="absolute top-3 right-3 bg-red-600 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold text-lg">
                    #{cartinha.numero_sequencial}
                  </div>
                )}

                {/* Foto da cartinha */}
                {cartinha.foto_cartinha && (
                  <div className="mb-4 flex justify-center">
                    <img
                      src={cartinha.foto_cartinha}
                      alt={`Foto da cartinha de ${cartinha.nome_crianca}`}
                      className="w-32 h-24 rounded-lg object-cover border-4 border-red-200 shadow-md"
                    />
                  </div>
                )}

                <div className="mb-4">
                  <h2 className="text-2xl font-bold text-red-700 mb-2">
                    {cartinha.nome_crianca}
                  </h2>
                  <p className="text-sm text-gray-500">
                    <span className="font-semibold">Idade:</span>{" "}
                    {cartinha.idade} anos
                  </p>
                  {cartinha.tag_nome && (
                    <p className="text-sm text-blue-600 mt-1">
                      <span className="font-semibold">🏷️ Categoria:</span>{" "}
                      {cartinha.tag_nome}
                    </p>
                  )}
                  {cartinha.data_limite_entrega && (
                    <p className="text-sm text-orange-600 mt-1">
                      <span className="font-semibold">📅 Entregar até:</span>{" "}
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

                <div className="bg-green-50 p-3 rounded mb-4">
                  <p className="text-green-800">
                    <span className="font-semibold">Presente desejado:</span>
                    <br />
                    {cartinha.presente_pedido}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleApadrinhar(cartinha)}
                    className={`flex-1 py-2 px-4 rounded font-semibold transition-all ${
                      carrinhoAtualizado[cartinha.id]
                        ? "bg-green-600 hover:bg-green-700 text-white"
                        : "bg-red-600 hover:bg-red-700 text-white"
                    }`}
                  >
                    {carrinhoAtualizado[cartinha.id]
                      ? "✓ Apadinhada"
                      : "🎁 Apadrinhar"}
                  </button>
                </div>

                <div className="text-xs text-gray-400 mt-3">
                  ID: {cartinha.id}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
