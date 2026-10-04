"use client";

import { atualizarPermissoesUsuario } from "@/app/actions/auth";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { usePaginacao } from "@/app/hooks/usePaginacao";
import Paginacao from "@/app/components/admin/Paginacao";
import { formatarTelefoneCelular } from "@/app/utils/usuarioCadastro";

interface UsuarioItem {
  id: number;
  nome: string;
  telefone: string;
  email: string;
  tipo: "admin" | "padrinho";
  admin_role: "master" | "full" | "editor" | null;
}

export default function TabelaUsuariosAdmin({
  dados,
  busca = "",
  buscandoPadrinho = false,
}: {
  dados: UsuarioItem[];
  busca?: string;
  buscandoPadrinho?: boolean;
}) {
  const router = useRouter();
  const [drafts, setDrafts] = useState<Record<number, Pick<UsuarioItem, "tipo" | "admin_role">>>(
    () =>
      Object.fromEntries(
        dados.map((usuario) => [
          usuario.id,
          { tipo: usuario.tipo, admin_role: usuario.admin_role },
        ]),
      ),
  );
  const [feedback, setFeedback] = useState<Record<number, string>>({});
  const [isPending, startTransition] = useTransition();
  const { paginaAtual, setPaginaAtual, totalPaginas, dadosPaginados } = usePaginacao(dados);

  const updateDraft = (
    usuarioId: number,
    patch: Partial<Pick<UsuarioItem, "tipo" | "admin_role">>,
  ) => {
    setDrafts((prev) => {
      const atual = prev[usuarioId];
      const proximo = { ...atual, ...patch };

      if (proximo.tipo !== "admin") {
        proximo.admin_role = null;
      }

      return {
        ...prev,
        [usuarioId]: proximo,
      };
    });
    setFeedback((prev) => ({ ...prev, [usuarioId]: "" }));
  };

  const salvar = (usuarioId: number) => {
    const draft = drafts[usuarioId];
    if (!draft) {
      return;
    }

    startTransition(async () => {
      const resultado = await atualizarPermissoesUsuario({
        usuarioId,
        tipo: draft.tipo,
        admin_role: draft.tipo === "admin" ? draft.admin_role : null,
      });

      setFeedback((prev) => ({
        ...prev,
        [usuarioId]: resultado.message,
      }));

      if (resultado.success) {
        router.refresh();
      }
    });
  };

  return (
    <div className="bg-white rounded-md border border-stone-200 overflow-hidden">
      <div className="p-4 border-b border-stone-100">
        <h2 className="font-bold text-sm text-ink">Administradores</h2>
        <p className="text-xs text-stone-500 mt-1">
          Para dar acesso de admin a um padrinho que já tem cadastro, busque por nome ou e-mail.
        </p>
        <form method="get" action="/admin" className="mt-3 flex gap-2">
          <input type="hidden" name="tab" value="usuarios" />
          <label htmlFor="busca-usuario" className="sr-only">
            Buscar padrinho por nome ou e-mail
          </label>
          <input
            id="busca-usuario"
            type="search"
            name="busca_usuario"
            defaultValue={busca}
            placeholder="Buscar padrinho por nome ou e-mail"
            maxLength={100}
            className="flex-1 min-w-0 p-2 border border-stone-300 rounded text-base md:text-sm focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded bg-ink text-white font-semibold text-sm hover:bg-stone-600"
          >
            Buscar
          </button>
          {busca && (
            <a
              href="/admin?tab=usuarios"
              className="px-4 py-2 rounded border border-stone-300 text-stone-600 font-semibold text-sm hover:bg-cream-deep flex items-center"
            >
              Limpar
            </a>
          )}
        </form>
        {busca && !buscandoPadrinho && (
          <p className="text-xs text-stone-500 mt-2">Digite pelo menos 2 letras para buscar padrinhos.</p>
        )}
      </div>

      <div className="divide-y divide-stone-100">
        {dadosPaginados.map((usuario) => {
          const draft = drafts[usuario.id] || {
            tipo: usuario.tipo,
            admin_role: usuario.admin_role,
          };

          return (
            <div key={usuario.id} className="p-4 flex flex-wrap items-end gap-4">
              <div className="min-w-45 flex-1">
                <p className="font-medium text-ink text-sm">{usuario.nome}</p>
                <p className="text-xs text-stone-500 mt-0.5">
                  {usuario.email} · {formatarTelefoneCelular(usuario.telefone)}
                </p>
                {feedback[usuario.id] && (
                  <p className="text-xs text-stone-500 mt-1">{feedback[usuario.id]}</p>
                )}
              </div>

              <div className="w-40">
                <label htmlFor={`tipo-usuario-${usuario.id}`} className="block text-[11px] font-semibold text-stone-500 uppercase tracking-wide mb-1">
                  Tipo
                </label>
                <select
                  id={`tipo-usuario-${usuario.id}`}
                  value={draft.tipo}
                  onChange={(event) =>
                    updateDraft(usuario.id, {
                      tipo: event.target.value as "admin" | "padrinho",
                    })
                  }
                  className="w-full p-2 border border-stone-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand"
                >
                  <option value="padrinho">Padrinho</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>

              <div className="w-56">
                <label htmlFor={`admin-role-${usuario.id}`} className="block text-[11px] font-semibold text-stone-500 uppercase tracking-wide mb-1">
                  Nível admin
                </label>
                {draft.tipo === "admin" ? (
                  <select
                    id={`admin-role-${usuario.id}`}
                    value={draft.admin_role ?? "editor"}
                    onChange={(event) =>
                      updateDraft(usuario.id, {
                        admin_role: event.target.value as "master" | "full" | "editor",
                      })
                    }
                    className="w-full p-2 border border-stone-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand"
                  >
                    <option value="editor">Editor</option>
                    <option value="full">Gerente</option>
                    <option value="master">Super Adm</option>
                  </select>
                ) : (
                  <p id={`admin-role-${usuario.id}`} className="p-2 text-sm text-stone-500">— não aplicável</p>
                )}
              </div>

              <button
                onClick={() => salvar(usuario.id)}
                disabled={isPending}
                className="px-4 py-2 rounded bg-ink text-white font-semibold text-sm hover:bg-stone-600 disabled:bg-stone-300"
              >
                Salvar
              </button>
            </div>
          );
        })}

        {dados.length === 0 && (
          <p className="px-4 py-8 text-center text-stone-500 text-sm">
            Nenhum administrador encontrado.
          </p>
        )}
      </div>
      <Paginacao
        paginaAtual={paginaAtual}
        totalPaginas={totalPaginas}
        totalRegistros={dados.length}
        onChange={setPaginaAtual}
      />
    </div>
  );
}
