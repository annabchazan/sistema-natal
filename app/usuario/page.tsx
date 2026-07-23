import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getUsuarioAutenticado } from "@/lib/auth";
import db from "@/lib/db";
import FormularioEditarPerfil from "@/app/components/usuario/FormularioEditarPerfil";
import BotaoCancelarApadrinamento from "@/app/components/usuario/BotaoCancelarApadrinamento";
import BotaoExcluirConta from "@/app/components/usuario/BotaoExcluirConta";
import { STATUS_CARTINHA } from "@/lib/statusCartinha";
import type { RowDataPacket } from "mysql2/promise";

interface CartinhaUsuarioRow extends RowDataPacket {
  id: number;
  nome_crianca: string;
  presente_pedido: string;
  numero_sequencial: number | null;
  status: string;
  data_limite_entrega: string | null;
  data_apadrinamento: string | null;
  foto_cartinha: string | null;
  nome_instituicao: string | null;
}

// Ordem do fluxo para a barra de progresso (estados especiais ficam fora)
const FLUXO = ["apadrinhada", "conferida", "embrulhado", "entregue"] as const;

const MENSAGEM_STATUS: Record<string, string> = {
  apadrinhada: "Aguardando conferência pela equipe.",
  conferida: "Presente conferido! Em breve será embrulhado.",
  embrulhado: "Presente embrulhado e pronto para entrega.",
  entregue: "Presente entregue à criança. Muito obrigado!",
  carente: "Esta cartinha precisa de atenção especial.",
  reapadrinhado: "Cartinha em processo de reapadrinhamento.",
  cancelada: "Este apadrinhamento foi cancelado.",
};

function IconeCalendario() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-3.5 h-3.5 shrink-0">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
    </svg>
  );
}

function IconeRelogio() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-3.5 h-3.5 shrink-0">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  );
}

function formatarData(data: string | Date | null): string {
  if (!data) return "";
  return new Date(data).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function BarraProgresso({ status }: { status: string }) {
  const indiceAtual = FLUXO.indexOf(status as (typeof FLUXO)[number]);
  const estaNoFluxo = indiceAtual !== -1;

  if (!estaNoFluxo) return null;

  const finalizado = indiceAtual === FLUXO.length - 1; // entregue: tudo concluído, sem etapa "em andamento"

  return (
    <div className="mt-4">
      <div className="flex gap-1.5">
        {FLUXO.map((etapa, i) => {
          const concluida = i < indiceAtual || finalizado;
          const atual = i === indiceAtual && !finalizado;
          return (
            <div
              key={etapa}
              title={STATUS_CARTINHA[etapa]?.label ?? etapa}
              className={`flex-1 h-[3px] rounded-full ${
                atual
                  ? "bg-brand"
                  : concluida
                  ? "bg-verde-natal"
                  : "bg-stone-200"
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}

export default async function UsuarioPage() {
  const usuario = await getUsuarioAutenticado();
  if (!usuario) redirect("/login");

  const [cartinhas] = await db.query<CartinhaUsuarioRow[]>(
    `SELECT
       c.id, c.nome_crianca, c.presente_pedido, c.numero_sequencial,
       c.status, c.data_limite_entrega, c.data_apadrinamento,
       c.foto_cartinha,
       i.nome_instituicao
     FROM cartinhas c
     LEFT JOIN instituicoes i ON c.instituicao_id = i.id
     WHERE c.apadrinhado_por_usuario_id = ?
     ORDER BY c.data_apadrinamento DESC`,
    [usuario.id],
  );

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  return (
    <div className="min-h-screen bg-cream py-14">
      <div className="container mx-auto px-4 max-w-3xl">

        <div className="bg-white border border-stone-200 border-t-[3px] border-t-brand rounded-md px-8 py-7 flex items-center justify-between mb-9">
          <div>
            <h1 className="text-xl font-bold text-ink">Olá, {usuario.nome.split(" ")[0]}</h1>
            <p className="text-[13px] text-stone-400 mt-0.5">{usuario.email}</p>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-[26px] font-bold text-ink">{cartinhas.length}</p>
            <p className="text-[11.5px] text-stone-400">
              apadrinhada{cartinhas.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        <FormularioEditarPerfil
          usuario={{
            nome: usuario.nome,
            telefone: usuario.telefone,
            email: usuario.email,
          }}
        />

        <div className="space-y-4 mt-8">
          <h2 className="text-[11px] font-bold text-stone-400 uppercase tracking-wide px-1">
            Suas cartinhas
          </h2>

          {cartinhas.length === 0 ? (
            <div className="bg-white rounded-md border border-stone-200 p-12 text-center">
              <p className="text-4xl mb-4 text-brand">♥</p>
              <p className="text-stone-500 text-base mb-6">
                Você ainda não apadrinhou nenhuma cartinha.
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded bg-ink border border-ink px-6 py-3 font-semibold text-sm text-white hover:bg-white hover:text-ink transition-colors"
              >
                Ver cartinhas disponíveis
              </Link>
            </div>
          ) : (
            cartinhas.map((cartinha) => {
              const statusInfo = STATUS_CARTINHA[cartinha.status as keyof typeof STATUS_CARTINHA] ?? {
                label: cartinha.status,
                dot: "bg-stone-400",
              };
              const info = {
                label: statusInfo.label,
                cor: statusInfo.dot,
                mensagem: MENSAGEM_STATUS[cartinha.status] ?? "",
              };

              const prazo = cartinha.data_limite_entrega
                ? new Date(cartinha.data_limite_entrega)
                : null;
              if (prazo) prazo.setHours(0, 0, 0, 0);

              const diasRestantes = prazo
                ? Math.ceil((prazo.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
                : null;

              const statusAtivo =
                cartinha.status !== "entregue" && cartinha.status !== "cancelada";

              const prazoVencido =
                diasRestantes !== null && diasRestantes < 0 && statusAtivo;

              const prazoUrgente =
                diasRestantes !== null &&
                diasRestantes >= 0 &&
                diasRestantes <= 7 &&
                statusAtivo;

              return (
                <div
                  key={cartinha.id}
                  className={`bg-white rounded-md border overflow-hidden transition-shadow hover:shadow-[0_8px_24px_rgba(30,27,23,.08)] ${
                    cartinha.status === "cancelada" ? "opacity-70" : ""
                  } ${
                    prazoVencido ? "border-vermelho-natal/40" : "border-stone-200"
                  }`}
                >
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                          {cartinha.foto_cartinha &&
                        !cartinha.foto_cartinha.startsWith("data:") ? (
                          <Image
                            src={cartinha.foto_cartinha}
                            alt={cartinha.nome_crianca}
                            width={64}
                            height={64}
                            className="w-16 h-16 rounded object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded bg-cream-deep flex items-center justify-center flex-shrink-0">
                            <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7 text-brand" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 1 0 9.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1 1 14.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" /></svg>
                          </div>
                        )}

                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-[15px] font-bold text-ink">
                              {cartinha.nome_crianca}
                            </h3>
                            {cartinha.numero_sequencial != null && (
                              <span className="text-xs text-stone-400 font-mono">
                                Nº {cartinha.numero_sequencial}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-stone-400">
                            {cartinha.nome_instituicao ?? "Instituição removida"} · {cartinha.presente_pedido}
                          </p>
                        </div>
                      </div>

                      <div className="flex-shrink-0 flex items-center gap-1.5">
                        <span className={`w-[7px] h-[7px] rounded-full ${info.cor}`} />
                        <span className="text-xs font-semibold text-stone-600">
                          {info.label}
                        </span>
                      </div>
                    </div>

                    <BarraProgresso status={cartinha.status} />

                    {info.mensagem && (
                      <p className="mt-3 text-[13px] text-stone-400 italic">
                        {info.mensagem}
                      </p>
                    )}

                    <div className="mt-4 pt-4 border-t border-stone-100 flex flex-wrap items-center justify-between gap-2 text-xs text-stone-400">
                      <span className="flex items-center gap-1.5">
                        <IconeCalendario />
                        Apadrinhado em{" "}
                        {cartinha.data_apadrinamento
                          ? formatarData(cartinha.data_apadrinamento)
                          : "—"}
                      </span>

                      <div className="flex items-center gap-3">
                        {prazo && statusAtivo && (
                          <span
                            className={`flex items-center gap-1.5 font-semibold ${
                              prazoVencido
                                ? "text-vermelho-natal"
                                : prazoUrgente
                                ? "text-brand-dark"
                                : "text-stone-500"
                            }`}
                          >
                            <IconeRelogio />
                            {prazoVencido
                              ? `Prazo vencido (${formatarData(cartinha.data_limite_entrega)})`
                              : prazoUrgente
                              ? `${diasRestantes === 0 ? "Prazo hoje" : `${diasRestantes} dia${diasRestantes !== 1 ? "s" : ""} para entregar`}`
                              : `Entregar até ${formatarData(cartinha.data_limite_entrega)}`}
                          </span>
                        )}

                        {cartinha.status === "apadrinhada" && (
                          <BotaoCancelarApadrinamento cartinhaId={cartinha.id} />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {cartinhas.length > 0 && (
          <div className="mt-8 text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded bg-ink border border-ink px-6 py-3 font-semibold text-sm text-white hover:bg-white hover:text-ink transition-colors"
            >
              Apadrinhar mais cartinhas
            </Link>
          </div>
        )}

        <div className="mt-12 border-t border-stone-200 pt-6 text-center">
          <p className="text-xs text-stone-400 mb-2">
            Ao excluir sua conta, seus dados serão removidos permanentemente.
          </p>
          <BotaoExcluirConta />
        </div>

      </div>
    </div>
  );
}
