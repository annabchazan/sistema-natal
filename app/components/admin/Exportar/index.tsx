"use client";

import { useState } from "react";

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

const STATUS_OPCOES = [
  { key: "disponivel",    label: "Disponível",    cor: "bg-green-100 text-green-700" },
  { key: "apadrinhada",   label: "Apadrinhada",   cor: "bg-blue-100 text-blue-700" },
  { key: "conferida",     label: "Conferida",     cor: "bg-purple-100 text-purple-700" },
  { key: "carente",       label: "Carente",       cor: "bg-amber-100 text-amber-700" },
  { key: "embrulhado",    label: "Embrulhado",    cor: "bg-indigo-100 text-indigo-700" },
  { key: "reapadrinhado", label: "Reapadrinhado", cor: "bg-yellow-100 text-yellow-700" },
  { key: "entregue",      label: "Entregue",      cor: "bg-emerald-100 text-emerald-700" },
  { key: "cancelada",     label: "Cancelada",     cor: "bg-red-100 text-red-700" },
];

export default function ExportarIndex() {
  const [statusSelecionados, setStatusSelecionados] = useState<Set<string>>(
    new Set(STATUS_OPCOES.map((s) => s.key))
  );
  const [colunasSelecionadas, setColunasSelecionadas] = useState<Set<string>>(
    new Set(COLUNAS.map((c) => c.key))
  );
  const [carregando, setCarregando] = useState(false);

  function toggleStatus(key: string) {
    setStatusSelecionados((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  function toggleColuna(key: string) {
    setColunasSelecionadas((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  function selecionarTodosStatus() {
    setStatusSelecionados(new Set(STATUS_OPCOES.map((s) => s.key)));
  }

  function limparStatus() {
    setStatusSelecionados(new Set());
  }

  function selecionarTodasColunas() {
    setColunasSelecionadas(new Set(COLUNAS.map((c) => c.key)));
  }

  function limparColunas() {
    setColunasSelecionadas(new Set());
  }

  function handleExportar() {
    if (statusSelecionados.size === 0) {
      alert("Selecione ao menos um status para exportar.");
      return;
    }
    if (colunasSelecionadas.size === 0) {
      alert("Selecione ao menos uma coluna para exportar.");
      return;
    }

    const params = new URLSearchParams({
      status:  [...statusSelecionados].join(","),
      colunas: [...colunasSelecionadas].join(","),
    });

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
        <h2 className="text-xl font-bold text-gray-800">Exportar Planilha</h2>
        <p className="text-sm text-gray-500 mt-1">
          Escolha os filtros e colunas desejados. O arquivo será baixado em formato CSV,
          compatível com Excel e Google Sheets.
        </p>
      </div>

      {/* Filtro de status */}
      <div className="rounded-xl border border-gray-200 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-700">Filtrar por status</h3>
          <div className="flex gap-2 text-xs">
            <button
              onClick={selecionarTodosStatus}
              className="text-blue-600 hover:underline"
            >
              Selecionar todos
            </button>
            <span className="text-gray-300">|</span>
            <button
              onClick={limparStatus}
              className="text-gray-500 hover:underline"
            >
              Limpar
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          {STATUS_OPCOES.map((s) => {
            const marcado = statusSelecionados.has(s.key);
            return (
              <button
                key={s.key}
                onClick={() => toggleStatus(s.key)}
                className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium border-2 transition-all ${
                  marcado
                    ? `${s.cor} border-current`
                    : "bg-white text-gray-400 border-gray-200 hover:border-gray-300"
                }`}
              >
                <span
                  className={`h-3.5 w-3.5 rounded-sm border-2 flex items-center justify-center flex-shrink-0 ${
                    marcado ? "border-current bg-current" : "border-gray-300"
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

        <p className="text-xs text-gray-400">
          {statusSelecionados.size} de {STATUS_OPCOES.length} status selecionados
        </p>
      </div>

      {/* Seleção de colunas */}
      <div className="rounded-xl border border-gray-200 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-700">Colunas da planilha</h3>
          <div className="flex gap-2 text-xs">
            <button
              onClick={selecionarTodasColunas}
              className="text-blue-600 hover:underline"
            >
              Selecionar todas
            </button>
            <span className="text-gray-300">|</span>
            <button
              onClick={limparColunas}
              className="text-gray-500 hover:underline"
            >
              Limpar
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {COLUNAS.map((col) => {
            const marcado = colunasSelecionadas.has(col.key);
            return (
              <label
                key={col.key}
                className={`flex items-center gap-3 rounded-lg border-2 px-4 py-3 cursor-pointer transition-all ${
                  marcado
                    ? "border-red-400 bg-red-50"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <input
                  type="checkbox"
                  checked={marcado}
                  onChange={() => toggleColuna(col.key)}
                  className="accent-red-600 h-4 w-4 flex-shrink-0"
                />
                <span className={`text-sm font-medium ${marcado ? "text-red-700" : "text-gray-500"}`}>
                  {col.label}
                </span>
              </label>
            );
          })}
        </div>

        <p className="text-xs text-gray-400">
          {colunasSelecionadas.size} de {COLUNAS.length} colunas selecionadas
        </p>
      </div>

      {/* Resumo e botão */}
      <div className="rounded-xl border border-dashed border-green-300 bg-green-50 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-green-800">Pronto para exportar</p>
          <p className="text-xs text-green-700 mt-0.5">
            Exportando {totalCartinhas} —{" "}
            {colunasSelecionadas.size} coluna{colunasSelecionadas.size !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={handleExportar}
          disabled={carregando || statusSelecionados.size === 0 || colunasSelecionadas.size === 0}
          className="flex items-center gap-2 rounded-lg bg-green-600 px-6 py-3 text-sm font-bold text-white shadow transition-colors hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
