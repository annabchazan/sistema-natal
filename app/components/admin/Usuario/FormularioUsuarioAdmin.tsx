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
    <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">
        Cadastrar Usuario
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            value={nome}
            onChange={(event) => setNome(event.target.value)}
            placeholder="Nome completo"
            className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-red-500"
          />
          <input
            value={telefone}
            onChange={(event) => setTelefone(event.target.value)}
            placeholder="Telefone"
            className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="E-mail"
            className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-red-500"
          />
          <input
            type="password"
            value={senha}
            onChange={(event) => setSenha(event.target.value)}
            placeholder="Senha"
            className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <select
            value={tipo}
            onChange={(event) =>
              setTipo(event.target.value as "admin" | "padrinho")
            }
            className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-red-500"
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
            className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-red-500 disabled:bg-gray-100"
          >
            <option value="editor">Admin editor</option>
            <option value="full">Admin completo</option>
            <option value="master">Admin master</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-red-600 text-white font-bold py-3 rounded-lg hover:bg-red-700 transition-all shadow-md disabled:bg-gray-400"
        >
          {isPending ? "Salvando..." : "Cadastrar usuario"}
        </button>

        {mensagem && (
          <p className="rounded bg-green-100 text-green-700 px-4 py-3 text-sm">
            {mensagem}
          </p>
        )}

        {erro && (
          <p className="rounded bg-red-100 text-red-700 px-4 py-3 text-sm">
            {erro}
          </p>
        )}
      </form>
    </div>
  );
}
