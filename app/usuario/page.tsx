import Link from "next/link";
import { redirect } from "next/navigation";
import { getUsuarioAutenticado } from "@/lib/auth";
import db from "@/lib/db";
import FormularioEditarPerfil from "@/app/components/usuario/FormularioEditarPerfil";
import BotaoCancelarApadrinamento from "@/app/components/usuario/BotaoCancelarApadrinamento";

// Ordem do fluxo para a barra de progresso (estados especiais ficam fora)
const FLUXO = ["apadrinhada", "conferida", "embrulhado", "entregue"] as const;

const STATUS_INFO: Record<string, { label: string; cor: string; mensagem: string }> = {
  apadrinhada:   { label: "Apadrinhada",   cor: "bg-blue-500",    mensagem: "Aguardando conferência pela equipe." },
  conferida:     { label: "Conferida",     cor: "bg-purple-500",  mensagem: "Presente conferido! Em breve será embrulhado." },
  embrulhado:    { label: "Embrulhado",    cor: "bg-indigo-500",  mensagem: "Presente embrulhado e pronto para entrega." },
  entregue:      { label: "Entregue",      cor: "bg-emerald-500", mensagem: "Presente entregue à criança. Muito obrigado!" },
  carente:       { label: "Carente",       cor: "bg-amber-500",   mensagem: "Esta cartinha precisa de atenção especial." },
  reapadrinhado: { label: "Reapadrinhado", cor: "bg-yellow-500",  mensagem: "Cartinha em processo de reapadrinhamento." },
  cancelada:     { label: "Cancelada",     cor: "bg-red-400",     mensagem: "Este apadrinhamento foi cancelado." },
};

function formatarData(data: any): string {
  if (!data) return "";
  return new Date(data).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function BarraProgresso({ status }: { status: string }) {
  const indiceAtual = FLUXO.indexOf(status as any);
  const estaNoFluxo = indiceAtual !== -1;

  if (!estaNoFluxo) return null;

  return (
    <div className="mt-4">
      <div className="flex items-center gap-1">
        {FLUXO.map((etapa, i) => {
          const concluida = i <= indiceAtual;
          const atual = i === indiceAtual;
          return (
            <div key={etapa} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`h-2.5 w-2.5 rounded-full border-2 transition-all ${
                    concluida
                      ? atual
                        ? "border-red-600 bg-red-600 scale-125"
                        : "border-green-600 bg-green-600"
                      : "border-gray-300 bg-white"
                  }`}
                />
                <span className={`mt-1 text-center text-[10px] leading-tight hidden sm:block ${
                  concluida ? "text-gray-700 font-medium" : "text-gray-400"
                }`}>
                  {STATUS_INFO[etapa]?.label ?? etapa}
                </span>
              </div>
              {i < FLUXO.length - 1 && (
                <div className={`h-0.5 flex-1 mx-0.5 mb-3 rounded ${
                  i < indiceAtual ? "bg-green-500" : "bg-gray-200"
                }`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default async function UsuarioPage() {
  const usuario = await getUsuarioAutenticado();
  if (!usuario) redirect("/login");

  const [cartinhas]: any = await db.query(
    `SELECT
       c.id, c.nome_crianca, c.presente_pedido, c.numero_sequencial,
       c.status, c.data_limite_entrega, c.data_apadrinamento,
       c.foto_cartinha,
       i.nome_instituicao
     FROM cartinhas c
     JOIN instituicoes i ON c.instituicao_id = i.id
     WHERE c.apadrinhado_por_usuario_id = ?
     ORDER BY c.data_apadrinamento DESC`,
    [usuario.id],
  );

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-green-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">

        <div className="bg-white rounded-2xl shadow-lg border border-green-100 overflow-hidden mb-8">
          <div className="bg-green-600 text-white px-8 py-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Olá, {usuario.nome.split(" ")[0]}!</h1>
              <p className="text-green-100 text-sm mt-1">{usuario.email}</p>
            </div>
            <div className="text-right hidden sm:block">
              <p className="text-3xl font-bold">{cartinhas.length}</p>
              <p className="text-green-100 text-sm">
                cartinha{cartinhas.length !== 1 ? "s" : ""} apadrinhada{cartinhas.length !== 1 ? "s" : ""}
              </p>
            </div>
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
          <h2 className="text-xl font-bold text-gray-800 px-1">
            Minhas Cartinhas
          </h2>

          {cartinhas.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
              <p className="text-5xl mb-4">🎄</p>
              <p className="text-gray-500 text-lg mb-6">
                Você ainda não apadrinhou nenhuma cartinha.
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-6 py-3 font-semibold text-white hover:bg-red-700 transition-colors"
              >
                Ver cartinhas disponíveis
              </Link>
            </div>
          ) : (
            cartinhas.map((cartinha: any) => {
              const info = STATUS_INFO[cartinha.status] ?? {
                label: cartinha.status,
                cor: "bg-gray-400",
                mensagem: "",
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
                  className={`bg-white rounded-2xl shadow-sm border overflow-hidden transition-shadow hover:shadow-md ${
                    cartinha.status === "entregue"
                      ? "border-emerald-200"
                      : cartinha.status === "cancelada"
                      ? "border-red-200 opacity-70"
                      : prazoVencido
                      ? "border-red-300"
                      : "border-gray-100"
                  }`}
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                          {cartinha.foto_cartinha &&
                        !cartinha.foto_cartinha.startsWith("data:") ? (
                          <img
                            src={cartinha.foto_cartinha}
                            alt={cartinha.nome_crianca}
                            className="w-16 h-16 rounded-xl object-cover flex-shrink-0 border-2 border-red-100"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-xl bg-red-50 border-2 border-red-100 flex items-center justify-center flex-shrink-0 text-2xl">
                            🎁
                          </div>
                        )}

                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-lg font-bold text-gray-900">
                              {cartinha.nome_crianca}
                            </h3>
                            {cartinha.numero_sequencial != null && (
                              <span className="text-xs text-gray-400 font-mono">
                                #{cartinha.numero_sequencial}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">
                            {cartinha.nome_instituicao}
                          </p>
                          <p className="text-sm text-gray-700 mt-1">
                            <span className="font-medium">Presente:</span>{" "}
                            {cartinha.presente_pedido}
                          </p>
                        </div>
                      </div>

                      <div className="flex-shrink-0 text-right">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-bold text-white ${info.cor}`}
                        >
                          {info.label}
                        </span>
                      </div>
                    </div>

                    <BarraProgresso status={cartinha.status} />

                    {info.mensagem && (
                      <p className="mt-3 text-sm text-gray-500 italic">
                        {info.mensagem}
                      </p>
                    )}

                    <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-400">
                      <span>
                        Apadrinhado em{" "}
                        {cartinha.data_apadrinamento
                          ? formatarData(cartinha.data_apadrinamento)
                          : "—"}
                      </span>

                      <div className="flex items-center gap-3">
                        {prazo && statusAtivo && (
                          <span
                            className={`font-semibold ${
                              prazoVencido
                                ? "text-red-600"
                                : prazoUrgente
                                ? "text-amber-600"
                                : "text-gray-500"
                            }`}
                          >
                            {prazoVencido
                              ? `⚠️ Prazo vencido (${formatarData(cartinha.data_limite_entrega)})`
                              : prazoUrgente
                              ? `⏰ ${diasRestantes === 0 ? "Prazo hoje" : `${diasRestantes} dia${diasRestantes !== 1 ? "s" : ""} para entregar`}`
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
              className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-6 py-3 font-semibold text-white hover:bg-red-700 transition-colors"
            >
              Apadrinhar mais cartinhas
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}
