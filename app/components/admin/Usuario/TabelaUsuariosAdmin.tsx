"use client";

import { atualizarPermissoesUsuario } from "@/app/actions/auth";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

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
}: {
  dados: UsuarioItem[];
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
        <h2 className="font-bold text-sm text-ink">Usuários cadastrados</h2>
      </div>

      <div className="divide-y divide-stone-100">
        {dados.map((usuario) => {
          const draft = drafts[usuario.id] || {
            tipo: usuario.tipo,
            admin_role: usuario.admin_role,
          };

          return (
            <div key={usuario.id} className="p-4 flex flex-wrap items-end gap-4">
              <div className="min-w-45 flex-1">
                <p className="font-medium text-ink text-sm">{usuario.nome}</p>
                <p className="text-xs text-stone-400 mt-0.5">
                  {usuario.email} · {usuario.telefone}
                </p>
                {feedback[usuario.id] && (
                  <p className="text-xs text-stone-400 mt-1">{feedback[usuario.id]}</p>
                )}
              </div>

              <div className="w-40">
                <label className="block text-[11px] font-semibold text-stone-400 uppercase tracking-wide mb-1">
                  Tipo
                </label>
                <select
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
                <label className="block text-[11px] font-semibold text-stone-400 uppercase tracking-wide mb-1">
                  Nível admin
                </label>
                {draft.tipo === "admin" ? (
                  <select
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
                  <p className="p-2 text-sm text-stone-300">— não aplicável</p>
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
          <p className="px-4 py-8 text-center text-stone-400 text-sm">
            Nenhum usuário encontrado.
          </p>
        )}
      </div>
    </div>
  );
}
