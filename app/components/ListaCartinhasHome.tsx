"use client";

import { useCarrinhoApadrinhamento } from "@/app/hooks/useCarrinhoApadrinhamento";
import { useState, useRef } from "react";
import Image from "next/image";
import FotoLightbox from "@/app/components/FotoLightbox";
import Drawer from "@/app/components/Drawer";
import { formatarDataCurta } from "@/app/utils/datas";
import { useToast } from "@/app/components/Toast";
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

interface Instituicao {
  id: number;
  nome_instituicao: string;
}

const ITENS_POR_PAGINA = 12;

export default function ListaCartinhasHome({
  cartinhas: cartinhasIniciais,
  totalInicial,
  tags,
  instituicoes,
  totalApadrinhadas = 0,
}: {
  cartinhas: Cartinha[];
  totalInicial: number;
  tags: Tag[];
  instituicoes: Instituicao[];
  totalApadrinhadas?: number;
}) {
  const { adicionarCartinha, removerCartinha, temCartinha } =
    useCarrinhoApadrinhamento();
  const { mostrarToast } = useToast();
  const [cartinhas, setCartinhas] = useState<Cartinha[]>(cartinhasIniciais);
  const [total, setTotal] = useState(totalInicial);

  const [buscaNome, setBuscaNome] = useState<string>("");
  const [filtroInstituicao, setFiltroInstituicao] = useState<string>("");
  const [filtroTag, setFiltroTag] = useState<string>("");
  const [filtroIdadeMin, setFiltroIdadeMin] = useState<string>("");
  const [filtroIdadeMax, setFiltroIdadeMax] = useState<string>("");
  const [filtrosAplicados, setFiltrosAplicados] = useState<FiltrosCartinhas>({});
  const [menuFiltrosAberto, setMenuFiltrosAberto] = useState(false);
  const [isCarregando, setIsCarregando] = useState(false);
  const mostrarFiltroInstituicao = instituicoes.length > 1;
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [fotoAberta, setFotoAberta] = useState<{ src: string; alt: string } | null>(null);
  const topoListaRef = useRef<HTMLDivElement>(null);

  // A paginação reaproveita os filtros já aplicados, não o que está digitado nos campos.
  const buscarPagina = async (
    pagina: number,
    filtros: FiltrosCartinhas = filtrosAplicados,
    rolarParaTopo = false,
  ) => {
    setIsCarregando(true);
    try {
      const resultado = await listarCartinhasFiltradas(filtros, pagina, ITENS_POR_PAGINA);
      setCartinhas(resultado.cartinhas);
      setTotal(resultado.total);
      setFiltrosAplicados(filtros);
      setPaginaAtual(pagina);
      if (rolarParaTopo) {
        topoListaRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    } catch (error) {
      console.error("Erro ao buscar cartinhas:", error);
    } finally {
      setIsCarregando(false);
    }
  };

  const aplicarFiltros = () => {
    const filtros: FiltrosCartinhas = {};
    if (buscaNome.trim())  filtros.nome_crianca   = buscaNome.trim();
    if (filtroInstituicao) filtros.instituicao_id = parseInt(filtroInstituicao);
    if (filtroTag)         filtros.tag_id         = parseInt(filtroTag);
    if (filtroIdadeMin)    filtros.idade_min      = parseInt(filtroIdadeMin);
    if (filtroIdadeMax)    filtros.idade_max      = parseInt(filtroIdadeMax);
    setMenuFiltrosAberto(false);
    buscarPagina(1, filtros);
  };

  const limparFiltros = () => {
    setBuscaNome("");
    setFiltroInstituicao("");
    setFiltroTag("");
    setFiltroIdadeMin("");
    setFiltroIdadeMax("");
    setMenuFiltrosAberto(false);
    buscarPagina(1, {});
  };

  // Idade mín. e máx. contam como um filtro só.
  const quantidadeFiltrosAtivos =
    Number(Boolean(filtrosAplicados.nome_crianca)) +
    Number(filtrosAplicados.instituicao_id !== undefined) +
    Number(filtrosAplicados.tag_id !== undefined) +
    Number(filtrosAplicados.idade_min !== undefined || filtrosAplicados.idade_max !== undefined);

  type ChaveFiltro = "nome" | "instituicao" | "tag" | "idade";

  const removerFiltro = (chave: ChaveFiltro) => {
    const filtros = { ...filtrosAplicados };
    if (chave === "nome") {
      delete filtros.nome_crianca;
      setBuscaNome("");
    } else if (chave === "instituicao") {
      delete filtros.instituicao_id;
      setFiltroInstituicao("");
    } else if (chave === "tag") {
      delete filtros.tag_id;
      setFiltroTag("");
    } else {
      delete filtros.idade_min;
      delete filtros.idade_max;
      setFiltroIdadeMin("");
      setFiltroIdadeMax("");
    }
    buscarPagina(1, filtros);
  };

  const chipsAtivos: { chave: ChaveFiltro; rotulo: string }[] = [];
  if (filtrosAplicados.nome_crianca) {
    chipsAtivos.push({ chave: "nome", rotulo: `Busca: ${filtrosAplicados.nome_crianca}` });
  }
  if (filtrosAplicados.instituicao_id !== undefined) {
    const nome = instituicoes.find((i) => i.id === filtrosAplicados.instituicao_id)?.nome_instituicao;
    chipsAtivos.push({ chave: "instituicao", rotulo: `Instituição: ${nome ?? filtrosAplicados.instituicao_id}` });
  }
  if (filtrosAplicados.tag_id !== undefined) {
    const nome = tags.find((t) => t.id === filtrosAplicados.tag_id)?.nome;
    chipsAtivos.push({ chave: "tag", rotulo: `Categoria: ${nome ?? filtrosAplicados.tag_id}` });
  }
  if (filtrosAplicados.idade_min !== undefined || filtrosAplicados.idade_max !== undefined) {
    const { idade_min: min, idade_max: max } = filtrosAplicados;
    const rotulo =
      min !== undefined && max !== undefined
        ? `Idade: ${min} a ${max} anos`
        : min !== undefined
          ? `Idade: a partir de ${min}`
          : `Idade: até ${max}`;
    chipsAtivos.push({ chave: "idade", rotulo });
  }

  const listaChips = chipsAtivos.length > 0 && (
    <ul className="flex flex-wrap gap-2 mb-6" aria-label="Filtros aplicados">
      {chipsAtivos.map((chip) => (
        <li key={chip.chave}>
          <button
            onClick={() => removerFiltro(chip.chave)}
            disabled={isCarregando}
            aria-label={`Remover filtro ${chip.rotulo}`}
            className="flex items-center gap-1.5 bg-white text-ink border border-stone-300 rounded-full pl-3 pr-2 py-1 text-[12.5px] hover:bg-cream-deep transition-colors disabled:opacity-50"
          >
            {chip.rotulo}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3.5 h-3.5" aria-hidden="true">
              <path strokeLinecap="round" d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </li>
      ))}
    </ul>
  );

  const classeRotulo = "block text-[11px] font-semibold text-stone-500 uppercase tracking-wide mb-1.5";
  const classeCampo = "w-full h-11 md:h-9 border-0 border-b-[1.5px] border-stone-300 bg-transparent text-base md:text-sm text-ink focus:outline-none focus:border-ink";

  // Os mesmos campos aparecem na barra (desktop) e no menu (celular); o prefixo evita id repetido.
  const renderCampos = (prefixo: string) => (
    <>
      <div className="col-span-2 lg:col-span-1">
        <label htmlFor={`${prefixo}-nome`} className={classeRotulo}>
          Nome ou presente
        </label>
        <input
          id={`${prefixo}-nome`}
          type="search"
          enterKeyHint="search"
          value={buscaNome}
          onChange={(e) => setBuscaNome(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") aplicarFiltros();
          }}
          placeholder="Nome, bola, boneca..."
          maxLength={100}
          className={`${classeCampo} placeholder:text-stone-400`}
        />
      </div>

      {mostrarFiltroInstituicao && (
        <div className="col-span-2 lg:col-span-1">
          <label htmlFor={`${prefixo}-instituicao`} className={classeRotulo}>
            Instituição
          </label>
          <select
            id={`${prefixo}-instituicao`}
            value={filtroInstituicao}
            onChange={(e) => setFiltroInstituicao(e.target.value)}
            className={classeCampo}
          >
            <option value="">Todas as instituições</option>
            {instituicoes.map((instituicao) => (
              <option key={instituicao.id} value={instituicao.id}>
                {instituicao.nome_instituicao}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="col-span-2 lg:col-span-1">
        <label htmlFor={`${prefixo}-categoria`} className={classeRotulo}>
          Categoria
        </label>
        <select
          id={`${prefixo}-categoria`}
          value={filtroTag}
          onChange={(e) => setFiltroTag(e.target.value)}
          className={classeCampo}
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
        <label htmlFor={`${prefixo}-idade-min`} className={classeRotulo}>
          Idade mín.
        </label>
        <input
          id={`${prefixo}-idade-min`}
          type="number"
          value={filtroIdadeMin}
          onChange={(e) => setFiltroIdadeMin(e.target.value)}
          placeholder="0"
          min="0"
          max="18"
          className={classeCampo}
        />
      </div>

      <div>
        <label htmlFor={`${prefixo}-idade-max`} className={classeRotulo}>
          Idade máx.
        </label>
        <input
          id={`${prefixo}-idade-max`}
          type="number"
          value={filtroIdadeMax}
          onChange={(e) => setFiltroIdadeMax(e.target.value)}
          placeholder="12"
          min="0"
          max="18"
          className={classeCampo}
        />
      </div>
    </>
  );

  const contagemEncontradas = `${total} ${total === 1 ? "cartinha encontrada" : "cartinhas encontradas"}`;

  const handleApadrinhar = (cartinha: Cartinha) => {
    if (temCartinha(cartinha.id)) {
      removerCartinha(cartinha.id);
      mostrarToast("Cartinha removida do carrinho.", "info");
    } else {
      adicionarCartinha(cartinha);
      mostrarToast("Cartinha adicionada ao carrinho!", "sucesso");
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
              Você pode transformar o Natal de uma criança. Escolha uma
              cartinha, prepare o presente e faça parte desse momento
              especial. Nós cuidaremos para que ele chegue até a criança, e
              você receberá uma confirmação quando isso acontecer.
            </p>
            <div className="flex gap-8">
              <div>
                <div className="text-2xl font-bold text-ink">{total}</div>
                <div className="text-xs text-stone-500">aguardando padrinho</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-ink">{totalApadrinhadas}</div>
                <div className="text-xs text-stone-500">já apadrinhadas</div>
              </div>
            </div>
          </div>
          <div className="h-56 lg:h-80 rounded-md overflow-hidden">
            <Image
              src="/banner-natal.jpeg"
              alt="Festa de Natal do Sempre Criança, com Papai Noel e crianças"
              width={1290}
              height={1260}
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </div>

      <div ref={topoListaRef} className="max-w-6xl mx-auto px-4 md:px-8 pb-16 scroll-mt-32">
        {/* Filtros: barra no desktop/tablet */}
        <div className="hidden md:block border-b border-stone-200 pb-5 mb-8">
          <div
            className={`grid grid-cols-4 gap-x-6 gap-y-5 items-end ${
              mostrarFiltroInstituicao
                ? "lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1.3fr)_minmax(0,1fr)_6rem_6rem]"
                : "lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_6rem_6rem]"
            }`}
          >
            {renderCampos("filtro")}
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-5">
            <button
              onClick={aplicarFiltros}
              disabled={isCarregando}
              className="bg-ink text-white border border-ink px-5 py-2 rounded font-semibold text-[13px] hover:bg-white hover:text-ink transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCarregando ? "Filtrando..." : "Filtrar"}
            </button>
            <button
              onClick={limparFiltros}
              disabled={isCarregando}
              className="bg-transparent text-stone-500 border border-stone-300 px-5 py-2 rounded font-semibold text-[13px] hover:bg-cream-deep transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Limpar
            </button>

            <div className="ml-auto text-[13px] text-stone-500">{contagemEncontradas}</div>
          </div>
        </div>

        {/* Filtros: botão + menu no celular */}
        <div className="md:hidden flex items-center justify-between gap-3 border-b border-stone-200 pb-4 mb-6">
          <button
            onClick={() => setMenuFiltrosAberto(true)}
            aria-haspopup="dialog"
            className="shrink-0 whitespace-nowrap flex items-center gap-2 bg-transparent text-ink border border-ink px-4 py-2 rounded font-semibold text-[13px] hover:bg-cream-deep transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4" aria-hidden="true">
              <path strokeLinecap="round" d="M4 6h16M7 12h10M10 18h4" />
            </svg>
            Filtros
            {quantidadeFiltrosAtivos > 0 && (
              <span className="bg-brand-dark text-white rounded-full min-w-5 h-5 px-1.5 text-[11px] leading-5 text-center">
                {quantidadeFiltrosAtivos}
              </span>
            )}
          </button>
          <div className="text-[13px] text-stone-500 text-right">{contagemEncontradas}</div>
        </div>

        <Drawer
          isOpen={menuFiltrosAberto}
          onClose={() => setMenuFiltrosAberto(false)}
          side="right"
          title="Filtrar cartinhas"
          width="w-80 max-w-[90vw]"
          footer={
            <div className="flex gap-3 p-4">
              <button
                onClick={limparFiltros}
                disabled={isCarregando}
                className="flex-1 bg-transparent text-stone-500 border border-stone-300 py-2.5 rounded font-semibold text-[13px] hover:bg-cream-deep transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Limpar
              </button>
              <button
                onClick={aplicarFiltros}
                disabled={isCarregando}
                className="flex-2 bg-ink text-white border border-ink py-2.5 rounded font-semibold text-[13px] hover:bg-white hover:text-ink transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCarregando ? "Filtrando..." : "Aplicar filtros"}
              </button>
            </div>
          }
        >
          <div className="grid grid-cols-2 gap-x-5 gap-y-6 p-5">
            {renderCampos("menu-filtro")}
          </div>
        </Drawer>

        {listaChips}

        {total === 0 ? (
          <div className="text-center py-20">
            <p className="text-lg text-stone-500">
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
            {cartinhas.map((cartinha) => (
              <div
                key={cartinha.id}
                className="bg-white border border-stone-200 rounded-md overflow-hidden hover:shadow-[0_8px_24px_rgba(30,27,23,.08)] transition-shadow"
              >
                <div
                  className={`relative aspect-[1754/1240] md:aspect-auto md:h-60 bg-[repeating-linear-gradient(135deg,#F0EAE0,#F0EAE0_10px,#E7DFD2_10px,#E7DFD2_20px)] ${
                    cartinha.foto_cartinha ? "group cursor-zoom-in" : ""
                  }`}
                  role={cartinha.foto_cartinha ? "button" : undefined}
                  tabIndex={cartinha.foto_cartinha ? 0 : undefined}
                  aria-label={
                    cartinha.foto_cartinha
                      ? `Ver foto da cartinha de ${cartinha.nome_crianca} em tela cheia`
                      : undefined
                  }
                  onClick={() =>
                    cartinha.foto_cartinha &&
                    setFotoAberta({
                      src: cartinha.foto_cartinha,
                      alt: `Foto da cartinha de ${cartinha.nome_crianca}`,
                    })
                  }
                  onKeyDown={(event) => {
                    if (!cartinha.foto_cartinha) return;
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setFotoAberta({
                        src: cartinha.foto_cartinha,
                        alt: `Foto da cartinha de ${cartinha.nome_crianca}`,
                      });
                    }
                  }}
                >
                  {cartinha.numero_sequencial !== undefined && (
                    <div className="absolute top-3 left-3 bg-white text-ink text-[11.5px] font-bold rounded px-2.5 py-1 z-10">
                      Nº {cartinha.numero_sequencial}
                    </div>
                  )}
                  {cartinha.foto_cartinha && (
                    <>
                      <Image
                        src={cartinha.foto_cartinha}
                        alt={`Foto da cartinha de ${cartinha.nome_crianca}`}
                        fill
                        className="object-contain"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors" />
                      <div className="absolute top-3 right-3 bg-black/50 text-white rounded-full p-1.5 z-10">
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                          className="w-4 h-4"
                        >
                          <circle cx="11" cy="11" r="7" />
                          <path strokeLinecap="round" d="m20 20-3.5-3.5M11 8v6M8 11h6" />
                        </svg>
                      </div>
                    </>
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
                    <span className="text-[13px] text-stone-500">
                      {cartinha.idade} anos
                    </span>
                  </div>
                  <p className="text-[13px] text-stone-500 leading-6 mb-3.5 line-clamp-3">
                    &quot;{cartinha.texto_cartinha}&quot;
                  </p>

                  <div className="flex justify-between text-[12.5px] mb-4 pt-3 border-t border-stone-100 gap-2">
                    <span className="text-stone-500">
                      Pedido: <strong className="text-stone-600">{cartinha.presente_pedido}</strong>
                    </span>
                    {cartinha.data_limite_entrega && (
                      <span className="text-stone-500 whitespace-nowrap">
                        Até {formatarDataCurta(cartinha.data_limite_entrega)}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => handleApadrinhar(cartinha)}
                    className={`w-full py-2.5 rounded font-semibold text-[13.5px] transition-colors flex items-center justify-center gap-1.5 ${
                      temCartinha(cartinha.id)
                        ? "bg-brand/10 text-brand-dark border border-brand hover:bg-brand/20"
                        : "bg-brand-dark text-white hover:bg-brand-darker"
                    }`}
                  >
                    {temCartinha(cartinha.id) && (
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
                    {temCartinha(cartinha.id)
                      ? "No carrinho"
                      : "Apadrinhar"}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {total > ITENS_POR_PAGINA && (
            <nav
              aria-label="Paginação das cartinhas"
              className="mt-8 sm:mt-12 pt-5 sm:pt-8 border-t border-stone-200 flex flex-col items-center gap-3 sm:gap-4"
            >
              <p className="text-stone-600 text-[13px] sm:text-[14px] text-center">
                Mostrando página <strong>{paginaAtual}</strong> de{" "}
                <strong>{Math.max(1, Math.ceil(total / ITENS_POR_PAGINA))}</strong>
                {paginaAtual < Math.ceil(total / ITENS_POR_PAGINA) && (
                  <> — ainda tem mais cartinhas esperando um padrinho!</>
                )}
              </p>
              <div className="flex items-center justify-center gap-2 sm:gap-3 w-full">
                <button
                  onClick={() => buscarPagina(Math.max(1, paginaAtual - 1), undefined, true)}
                  disabled={paginaAtual === 1 || isCarregando}
                  className="flex-1 sm:flex-none sm:min-w-40 py-2.5 px-4 rounded border-2 border-brand-dark text-brand-dark font-semibold text-[13.5px] hover:bg-brand/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  ← Anterior
                </button>
                <button
                  onClick={() => buscarPagina(Math.min(Math.ceil(total / ITENS_POR_PAGINA), paginaAtual + 1), undefined, true)}
                  disabled={paginaAtual === Math.ceil(total / ITENS_POR_PAGINA) || isCarregando}
                  className="flex-1 sm:flex-none sm:min-w-40 py-2.5 px-4 rounded bg-brand-dark text-white font-semibold text-[13.5px] hover:bg-brand-darker transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Próxima →
                </button>
              </div>
            </nav>
          )}
          </>
        )}
      </div>

      <FotoLightbox
        src={fotoAberta?.src ?? null}
        alt={fotoAberta?.alt ?? ""}
        onClose={() => setFotoAberta(null)}
      />
    </div>
  );
}
