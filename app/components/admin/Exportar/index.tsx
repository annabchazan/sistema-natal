"use client";

import { useState } from "react";
import { STATUS_CARTINHA } from "@/lib/statusCartinha";
import { useToast } from "@/app/components/Toast";

const COLUNAS = [
  { key: "numero",              label: "Número" },
  { key: "nome_crianca",        label: "Nome da Criança" },
  { key: "idade",               label: "Idade" },
  { key: "instituicao",         label: "Instituição" },
  { key: "status",              label: "Status" },
  { key: "presente",            label: "Presente Pedido" },
  { key: "prazo",               label: "Prazo de Entrega" },
  { key: "data_apadrinhamento", label: "Data de Apadrinhamento" },
  { key: "padrinho_nome",       label: "Padrinho — Nome" },
  { key: "padrinho_telefone",   label: "Padrinho — Telefone" },
  { key: "padrinho_email",      label: "Padrinho — E-mail" },
];

const STATUS_OPCOES = Object.entries(STATUS_CARTINHA).map(([key, { label, badge }]) => ({
  key,
  label,
  cor: badge,
}));

interface InstituicaoOption {
  id: number;
  nome_instituicao: string;
}

function IconeChevron({ aberto }: { aberto: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      className={`w-4 h-4 text-stone-500 shrink-0 transition-transform duration-200 ${aberto ? "rotate-180" : ""}`}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
    </svg>
  );
}

function SecaoFiltro({
  titulo,
  resumo,
  aberto,
  onToggle,
  onSelecionarTodos,
  onLimpar,
  children,
}: {
  titulo: string;
  resumo: string;
  aberto: boolean;
  onToggle: () => void;
  onSelecionarTodos: () => void;
  onLimpar: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-md border border-stone-200 p-6 space-y-4">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={aberto}
        className="w-full flex items-center justify-between gap-4 text-left"
      >
        <div>
          <h3 className="font-semibold text-sm text-ink">{titulo}</h3>
          <p className="text-xs text-stone-500 mt-0.5">{resumo}</p>
        </div>
        <IconeChevron aberto={aberto} />
      </button>

      {aberto && (
        <div className="space-y-4">
          <div className="flex gap-2 text-xs">
            <button onClick={onSelecionarTodos} className="text-brand-dark hover:underline">
              Selecionar todos
            </button>
            <span className="text-stone-300">|</span>
            <button onClick={onLimpar} className="text-stone-500 hover:underline">
              Limpar
            </button>
          </div>
          {children}
        </div>
      )}
    </div>
  );
}

export default function ExportarIndex({
  instituicoes,
}: {
  instituicoes: InstituicaoOption[];
}) {
  const [statusSelecionados, setStatusSelecionados] = useState<Set<string>>(
    new Set(STATUS_OPCOES.map((s) => s.key))
  );
  const [instituicoesSelecionadas, setInstituicoesSelecionadas] = useState<Set<number>>(
    new Set(instituicoes.map((i) => i.id))
  );
  const [colunasSelecionadas, setColunasSelecionadas] = useState<Set<string>>(
    new Set(COLUNAS.map((c) => c.key))
  );
  const [carregando, setCarregando] = useState(false);
  const [abertoStatus, setAbertoStatus] = useState(false);
  const [abertoInstituicao, setAbertoInstituicao] = useState(false);
  const [abertoColunas, setAbertoColunas] = useState(false);
  const { mostrarToast } = useToast();

  function toggleStatus(key: string) {
    setStatusSelecionados((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  function toggleInstituicao(id: number) {
    setInstituicoesSelecionadas((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function toggleColuna(key: string) {
    setColunasSelecionadas((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  function selecionarTodosStatus() {
    setStatusSelecionados(new Set(STATUS_OPCOES.map((s) => s.key)));
  }

  function limparStatus() {
    setStatusSelecionados(new Set());
  }

  function selecionarTodasInstituicoes() {
    setInstituicoesSelecionadas(new Set(instituicoes.map((i) => i.id)));
  }

  function limparInstituicoes() {
    setInstituicoesSelecionadas(new Set());
  }

  function selecionarTodasColunas() {
    setColunasSelecionadas(new Set(COLUNAS.map((c) => c.key)));
  }

  function limparColunas() {
    setColunasSelecionadas(new Set());
  }

  function handleExportar() {
    if (statusSelecionados.size === 0) {
      mostrarToast("Selecione ao menos um status para exportar.", "erro");
      return;
    }
    if (instituicoes.length > 0 && instituicoesSelecionadas.size === 0) {
      mostrarToast("Selecione ao menos uma instituição para exportar.", "erro");
      return;
    }
    if (colunasSelecionadas.size === 0) {
      mostrarToast("Selecione ao menos uma coluna para exportar.", "erro");
      return;
    }

    const params = new URLSearchParams({
      status:  [...statusSelecionados].join(","),
      colunas: [...colunasSelecionadas].join(","),
    });
    if (instituicoes.length > 0) {
      params.set("instituicoes", [...instituicoesSelecionadas].join(","));
    }

    setCarregando(true);
    // Cria um link temporário e dispara o download
    const a = document.createElement("a");
    a.href = `/api/admin/exportar?${params.toString()}`;
    a.download = "";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    // Aguarda 2s para o browser iniciar o download antes de resetar o estado
    setTimeout(() => setCarregando(false), 2000);
  }

  const totalCartinhas =
    statusSelecionados.size === STATUS_OPCOES.length
      ? "todas as cartinhas"
      : `cartinhas com status: ${[...statusSelecionados]
          .map((k) => STATUS_OPCOES.find((s) => s.key === k)?.label)
          .join(", ")}`;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-bold text-ink">Exportar planilha</h2>
        <p className="text-sm text-stone-500 mt-1">
          Escolha os filtros e colunas desejados. O arquivo será baixado em formato CSV,
          compatível com Excel e Google Sheets.
        </p>
      </div>

      {/* Filtro de status */}
      <SecaoFiltro
        titulo="Filtrar por status"
        resumo={`${statusSelecionados.size} de ${STATUS_OPCOES.length} status selecionados`}
        aberto={abertoStatus}
        onToggle={() => setAbertoStatus((v) => !v)}
        onSelecionarTodos={selecionarTodosStatus}
        onLimpar={limparStatus}
      >
        <div className="flex flex-wrap gap-3">
          {STATUS_OPCOES.map((s) => {
            const marcado = statusSelecionados.has(s.key);
            return (
              <button
                key={s.key}
                onClick={() => toggleStatus(s.key)}
                className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium border-2 transition-colors ${
                  marcado
                    ? `${s.cor} border-current`
                    : "bg-white text-stone-500 border-stone-200 hover:border-stone-300"
                }`}
              >
                <span
                  className={`h-3.5 w-3.5 rounded-sm border-2 flex items-center justify-center flex-shrink-0 ${
                    marcado ? "border-current bg-current" : "border-stone-300"
                  }`}
                >
                  {marcado && (
                    <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 10 10">
                      <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
                {s.label}
              </button>
            );
          })}
        </div>
      </SecaoFiltro>

      {/* Filtro de instituição */}
      {instituicoes.length > 0 && (
        <SecaoFiltro
          titulo="Filtrar por instituição"
          resumo={`${instituicoesSelecionadas.size} de ${instituicoes.length} instituições selecionadas`}
          aberto={abertoInstituicao}
          onToggle={() => setAbertoInstituicao((v) => !v)}
          onSelecionarTodos={selecionarTodasInstituicoes}
          onLimpar={limparInstituicoes}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {instituicoes.map((inst) => {
              const marcado = instituicoesSelecionadas.has(inst.id);
              return (
                <label
                  key={inst.id}
                  className={`flex items-center gap-3 min-w-0 rounded border-2 px-4 py-3 cursor-pointer transition-colors ${
                    marcado
                      ? "border-brand bg-brand/5"
                      : "border-stone-200 bg-white hover:border-stone-300"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={marcado}
                    onChange={() => toggleInstituicao(inst.id)}
                    className="accent-brand h-4 w-4 shrink-0"
                  />
                  <span className={`text-sm font-medium min-w-0 break-words ${marcado ? "text-brand-dark" : "text-stone-500"}`}>
                    {inst.nome_instituicao}
                  </span>
                </label>
              );
            })}
          </div>
        </SecaoFiltro>
      )}

      {/* Seleção de colunas */}
      <SecaoFiltro
        titulo="Colunas da planilha"
        resumo={`${colunasSelecionadas.size} de ${COLUNAS.length} colunas selecionadas`}
        aberto={abertoColunas}
        onToggle={() => setAbertoColunas((v) => !v)}
        onSelecionarTodos={selecionarTodasColunas}
        onLimpar={limparColunas}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {COLUNAS.map((col) => {
            const marcado = colunasSelecionadas.has(col.key);
            return (
              <label
                key={col.key}
                className={`flex items-center gap-3 min-w-0 rounded border-2 px-4 py-3 cursor-pointer transition-colors ${
                  marcado
                    ? "border-brand bg-brand/5"
                    : "border-stone-200 bg-white hover:border-stone-300"
                }`}
              >
                <input
                  type="checkbox"
                  checked={marcado}
                  onChange={() => toggleColuna(col.key)}
                  className="accent-brand h-4 w-4 flex-shrink-0"
                />
                <span className={`text-sm font-medium min-w-0 break-words ${marcado ? "text-brand-dark" : "text-stone-500"}`}>
                  {col.label}
                </span>
              </label>
            );
          })}
        </div>
      </SecaoFiltro>

      {/* Resumo e botão */}
      <div className="rounded-md border border-dashed border-verde-natal/40 bg-verde-natal/5 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-verde-natal">Pronto para exportar</p>
          <p className="text-xs text-verde-natal mt-0.5">
            Exportando {totalCartinhas} —{" "}
            {colunasSelecionadas.size} coluna{colunasSelecionadas.size !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={handleExportar}
          disabled={carregando || statusSelecionados.size === 0 || colunasSelecionadas.size === 0}
          className="flex items-center gap-2 rounded bg-verde-natal px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {carregando ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Gerando...
            </>
          ) : (
            "Baixar planilha (.csv)"
          )}
        </button>
      </div>
    </div>
  );
}
