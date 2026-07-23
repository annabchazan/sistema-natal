"use client";

import { cadastrarUsuarioAdmin } from "@/app/actions/auth";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export default function FormularioUsuarioAdmin() {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [tipo, setTipo] = useState<"admin" | "padrinho">("padrinho");
  const [adminRole, setAdminRole] = useState<"master" | "full" | "editor">("editor");
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMensagem("");
    setErro("");

    startTransition(async () => {
      const resultado = await cadastrarUsuarioAdmin({
        nome,
        telefone,
        email,
        senha,
        tipo,
        admin_role: tipo === "admin" ? adminRole : null,
      });

      if (!resultado.success) {
        setErro(resultado.message);
        return;
      }

      setMensagem(resultado.message);
      setNome("");
      setTelefone("");
      setEmail("");
      setSenha("");
      setTipo("padrinho");
      setAdminRole("editor");
      router.refresh();
    });
  };

  return (
    <div className="bg-white rounded-md border border-stone-200 p-6">
      <h2 className="text-lg font-bold text-ink mb-4">
        Cadastrar usuário
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            value={nome}
            onChange={(event) => setNome(event.target.value)}
            placeholder="Nome completo"
            className="w-full p-3 border border-stone-300 rounded text-sm outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand"
          />
          <input
            value={telefone}
            onChange={(event) => setTelefone(event.target.value)}
            placeholder="Telefone"
            className="w-full p-3 border border-stone-300 rounded text-sm outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="E-mail"
            className="w-full p-3 border border-stone-300 rounded text-sm outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand"
          />
          <input
            type="password"
            value={senha}
            onChange={(event) => setSenha(event.target.value)}
            placeholder="Senha"
            className="w-full p-3 border border-stone-300 rounded text-sm outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <select
            value={tipo}
            onChange={(event) =>
              setTipo(event.target.value as "admin" | "padrinho")
            }
            className="w-full p-3 border border-stone-300 rounded text-sm outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand"
          >
            <option value="padrinho">Padrinho</option>
            <option value="admin">Administrador</option>
          </select>

          <select
            value={adminRole}
            onChange={(event) =>
              setAdminRole(event.target.value as "master" | "full" | "editor")
            }
            disabled={tipo !== "admin"}
            className="w-full p-3 border border-stone-300 rounded text-sm outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand disabled:bg-cream-deep"
          >
            <option value="editor">Editor — só edita</option>
            <option value="full">Gerente — edita, cria e exclui</option>
            <option value="master">Super Adm — tudo, mais gerenciar usuários</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-ink text-white font-bold py-3 rounded text-sm hover:bg-stone-600 transition-colors disabled:bg-stone-300"
        >
          {isPending ? "Salvando..." : "Cadastrar usuário"}
        </button>

        {mensagem && (
          <p className="rounded bg-verde-natal/10 text-verde-natal px-4 py-3 text-sm">
            {mensagem}
          </p>
        )}

        {erro && (
          <p className="rounded bg-vermelho-natal/10 text-vermelho-natal px-4 py-3 text-sm">
            {erro}
          </p>
        )}
      </form>
    </div>
  );
}
