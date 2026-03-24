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
  admin_role: "full" | "editor" | null;
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
    <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
      <div className="p-4 border-b">
        <h2 className="font-bold text-gray-700">Usuarios cadastrados</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-600">
          <thead className="text-xs uppercase bg-gray-50 text-gray-700">
            <tr>
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">E-mail</th>
              <th className="px-4 py-3">Telefone</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Nivel admin</th>
              <th className="px-4 py-3 text-right">Acao</th>
            </tr>
          </thead>
          <tbody>
            {dados.map((usuario) => {
              const draft = drafts[usuario.id] || {
                tipo: usuario.tipo,
                admin_role: usuario.admin_role,
              };

              return (
                <tr key={usuario.id} className="border-b last:border-b-0">
                  <td className="px-4 py-4 font-medium text-gray-900">
                    <div>{usuario.nome}</div>
                    {feedback[usuario.id] && (
                      <div className="text-xs text-gray-500 mt-1">
                        {feedback[usuario.id]}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-4">{usuario.email}</td>
                  <td className="px-4 py-4">{usuario.telefone}</td>
                  <td className="px-4 py-4">
                    <select
                      value={draft.tipo}
                      onChange={(event) =>
                        updateDraft(usuario.id, {
                          tipo: event.target.value as "admin" | "padrinho",
                        })
                      }
                      className="w-full p-2 border border-gray-300 rounded-lg"
                    >
                      <option value="padrinho">Padrinho</option>
                      <option value="admin">Administrador</option>
                    </select>
                  </td>
                  <td className="px-4 py-4">
                    <select
                      value={draft.admin_role ?? "editor"}
                      disabled={draft.tipo !== "admin"}
                      onChange={(event) =>
                        updateDraft(usuario.id, {
                          admin_role: event.target.value as "full" | "editor",
                        })
                      }
                      className="w-full p-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
                    >
                      <option value="editor">Admin editor</option>
                      <option value="full">Admin completo</option>
                    </select>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <button
                      onClick={() => salvar(usuario.id)}
                      disabled={isPending}
                      className="px-4 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 disabled:bg-gray-400"
                    >
                      Salvar
                    </button>
                  </td>
                </tr>
              );
            })}

            {dados.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                  Nenhum usuario encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
