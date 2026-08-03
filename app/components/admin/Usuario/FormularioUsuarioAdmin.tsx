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
          <div>
            <label htmlFor="novo-usuario-nome" className="block text-[12.5px] font-semibold text-stone-600 mb-1">
              Nome completo
            </label>
            <input
              id="novo-usuario-nome"
              value={nome}
              onChange={(event) => setNome(event.target.value)}
              required
              placeholder="Nome completo"
              className="w-full p-3 border border-stone-300 rounded text-sm outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand"
            />
          </div>
          <div>
            <label htmlFor="novo-usuario-telefone" className="block text-[12.5px] font-semibold text-stone-600 mb-1">
              Telefone
            </label>
            <input
              id="novo-usuario-telefone"
              value={telefone}
              onChange={(event) => setTelefone(event.target.value)}
              required
              placeholder="Telefone"
              className="w-full p-3 border border-stone-300 rounded text-sm outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="novo-usuario-email" className="block text-[12.5px] font-semibold text-stone-600 mb-1">
              E-mail
            </label>
            <input
              id="novo-usuario-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              placeholder="E-mail"
              className="w-full p-3 border border-stone-300 rounded text-sm outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand"
            />
          </div>
          <div>
            <label htmlFor="novo-usuario-senha" className="block text-[12.5px] font-semibold text-stone-600 mb-1">
              Senha
            </label>
            <input
              id="novo-usuario-senha"
              type="password"
              value={senha}
              onChange={(event) => setSenha(event.target.value)}
              required
              placeholder="Senha"
              className="w-full p-3 border border-stone-300 rounded text-sm outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="novo-usuario-tipo" className="block text-[12.5px] font-semibold text-stone-600 mb-1">
              Tipo de usuário
            </label>
            <select
              id="novo-usuario-tipo"
              value={tipo}
              onChange={(event) =>
                setTipo(event.target.value as "admin" | "padrinho")
              }
              className="w-full p-3 border border-stone-300 rounded text-sm outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand"
            >
              <option value="padrinho">Padrinho</option>
              <option value="admin">Administrador</option>
            </select>
          </div>

          <div>
            <label htmlFor="novo-usuario-papel-admin" className="block text-[12.5px] font-semibold text-stone-600 mb-1">
              Papel de admin
            </label>
            <select
              id="novo-usuario-papel-admin"
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
