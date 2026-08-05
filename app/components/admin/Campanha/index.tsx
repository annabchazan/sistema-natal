"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { finalizarCampanha } from "@/app/actions/campanhas";
import { useToast } from "@/app/components/Toast";
import type { CampanhaRow } from "@/app/actions/campanhas";

interface Props {
  campanhas: CampanhaRow[];
  canManage: boolean;
}

function formatarData(data: string): string {
  return new Date(data).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function CampanhasIndex({ campanhas, canManage }: Props) {
  const router = useRouter();
  const { mostrarToast } = useToast();
  const [finalizando, setFinalizando] = useState(false);

  const campanhaAtiva = campanhas.find((c) => !c.data_encerramento);
  const encerradas = campanhas.filter((c) => c.data_encerramento);

  const handleFinalizar = async () => {
    if (!campanhaAtiva) return;
    if (
      !confirm(
        `Encerrar a campanha de ${campanhaAtiva.ano}? Isso congela os números atuais no histórico e as cartinhas dela deixam de aparecer no site — novas cartinhas cadastradas depois entram numa campanha seguinte. Essa ação não pode ser desfeita pelo painel.`,
      )
    ) {
      return;
    }

    setFinalizando(true);
    const resultado = await finalizarCampanha();
    mostrarToast(resultado.message, resultado.success ? "sucesso" : "erro");
    setFinalizando(false);
    if (resultado.success) {
      router.refresh();
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-md border border-stone-200">
        <h2 className="text-lg font-bold text-ink">Campanhas</h2>
        <p className="text-sm text-stone-500">
          Histórico ano a ano do Natal Solidário. Encerrar a campanha congela
          os números atuais e libera o sistema para a campanha seguinte.
        </p>
      </div>

      {campanhaAtiva && (
        <div className="bg-white rounded-md border border-stone-200 border-t-[3px] border-t-brand p-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="inline-block px-2 py-0.5 rounded-full text-xs font-bold bg-verde-natal/10 text-verde-natal mb-2">
              Em andamento
            </span>
            <h3 className="text-xl font-bold text-ink">
              Campanha {campanhaAtiva.ano}
            </h3>
            <p className="text-sm text-stone-500 mt-1">
              Os números desta campanha ficam disponíveis na aba{" "}
              <span className="font-semibold">Visão geral</span> enquanto ela
              estiver ativa.
            </p>
          </div>

          {canManage ? (
            <button
              onClick={handleFinalizar}
              disabled={finalizando}
              className="bg-ink text-white px-5 py-2.5 rounded font-semibold text-sm hover:bg-stone-600 transition-colors disabled:opacity-50 shrink-0"
            >
              {finalizando ? "Encerrando..." : "Finalizar campanha"}
            </button>
          ) : (
            <p className="text-xs text-stone-500 shrink-0">
              Apenas o Super Adm pode encerrar a campanha.
            </p>
          )}
        </div>
      )}

      <div className="bg-white rounded-md border border-stone-200 overflow-hidden">
        <div className="p-4 border-b border-stone-100">
          <h3 className="text-sm font-bold text-ink">Campanhas encerradas</h3>
        </div>

        {encerradas.length === 0 ? (
          <p className="px-6 py-8 text-center text-stone-500 text-sm">
            Nenhuma campanha encerrada ainda.
          </p>
        ) : (
          <>
            <table className="hidden md:table w-full text-sm text-left text-stone-500">
              <thead className="text-xs text-stone-500 uppercase bg-cream-deep">
                <tr>
                  <th className="px-6 py-3">Ano</th>
                  <th className="px-6 py-3">Encerrada em</th>
                  <th className="px-6 py-3">Instituições</th>
                  <th className="px-6 py-3">Cartinhas</th>
                  <th className="px-6 py-3">Apadrinhadas</th>
                  <th className="px-6 py-3">Entregues</th>
                </tr>
              </thead>
              <tbody>
                {encerradas.map((campanha) => (
                  <tr key={campanha.id} className="bg-white border-b border-stone-100 hover:bg-cream-deep">
                    <td className="px-6 py-4 font-semibold text-ink">{campanha.ano}</td>
                    <td className="px-6 py-4">
                      {campanha.data_encerramento ? formatarData(campanha.data_encerramento) : "—"}
                    </td>
                    <td className="px-6 py-4">{campanha.total_instituicoes ?? "—"}</td>
                    <td className="px-6 py-4">{campanha.total_cartinhas ?? "—"}</td>
                    <td className="px-6 py-4">{campanha.total_apadrinhadas ?? "—"}</td>
                    <td className="px-6 py-4">{campanha.total_entregues ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="md:hidden divide-y divide-stone-100">
              {encerradas.map((campanha) => (
                <div key={campanha.id} className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-ink">Campanha {campanha.ano}</p>
                    <p className="text-xs text-stone-500">
                      {campanha.data_encerramento ? formatarData(campanha.data_encerramento) : "—"}
                    </p>
                  </div>
                  <p className="text-sm text-stone-600">
                    <span className="text-stone-500">Instituições:</span>{" "}
                    {campanha.total_instituicoes ?? "—"}
                  </p>
                  <p className="text-sm text-stone-600">
                    <span className="text-stone-500">Cartinhas:</span> {campanha.total_cartinhas ?? "—"}
                  </p>
                  <p className="text-sm text-stone-600">
                    <span className="text-stone-500">Apadrinhadas:</span>{" "}
                    {campanha.total_apadrinhadas ?? "—"}
                  </p>
                  <p className="text-sm text-stone-600">
                    <span className="text-stone-500">Entregues:</span> {campanha.total_entregues ?? "—"}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
