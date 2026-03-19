"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  emailValido,
  formatarTelefoneCelular,
  telefoneEhCelular,
} from "@/app/utils/usuarioCadastro";
import { cadastrarUsuario } from "@/app/actions/auth";

interface FormularioCadastro {
  nome: string;
  telefone: string;
  email: string;
  senha: string;
  confirmarSenha: string;
}

export default function CadastroPage() {
  const router = useRouter();
  const [formulario, setFormulario] = useState<FormularioCadastro>({
    nome: "",
    telefone: "",
    email: "",
    senha: "",
    confirmarSenha: "",
  });
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  const handleChange = (campo: keyof FormularioCadastro, valor: string) => {
    setErro("");

    setFormulario((prev) => ({
      ...prev,
      [campo]: campo === "telefone" ? formatarTelefoneCelular(valor) : valor,
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSalvando(true);

    const nome = formulario.nome.trim();
    const telefone = formulario.telefone.trim();
    const email = formulario.email.trim().toLowerCase();
    const senha = formulario.senha;
    const confirmarSenha = formulario.confirmarSenha;

    if (nome.length < 3) {
      setErro("Informe um nome completo com pelo menos 3 caracteres.");
      setSalvando(false);
      return;
    }

    if (!telefoneEhCelular(telefone)) {
      setErro(
        "Informe um celular valido com DDD. Telefones fixos nao sao aceitos.",
      );
      setSalvando(false);
      return;
    }

    if (!emailValido(email)) {
      setErro("Informe um e-mail valido.");
      setSalvando(false);
      return;
    }

    if (senha.length < 6) {
      setErro("A senha deve ter pelo menos 6 caracteres.");
      setSalvando(false);
      return;
    }

    if (senha !== confirmarSenha) {
      setErro("A confirmacao de senha nao confere.");
      setSalvando(false);
      return;
    }

    const resultado = await cadastrarUsuario({ nome, telefone, email, senha });

    if (!resultado.success) {
      setErro(resultado.message);
      setSalvando(false);
      return;
    }

    window.dispatchEvent(new Event("auth-changed"));
    router.push("/usuario");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-red-50 to-green-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl border border-red-100 overflow-hidden">
          <div className="bg-red-600 text-white p-8">
            <h1 className="text-3xl font-bold">Cadastro do Usuario</h1>
            <p className="mt-2 text-red-100">
              Preencha seus dados para acessar sua area no Sistema Natal.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            <div>
              <label
                htmlFor="nome"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Nome completo
              </label>
              <input
                id="nome"
                type="text"
                value={formulario.nome}
                onChange={(event) => handleChange("nome", event.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Digite seu nome completo"
                autoComplete="name"
              />
            </div>

            <div>
              <label
                htmlFor="telefone"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Celular
              </label>
              <input
                id="telefone"
                type="tel"
                value={formulario.telefone}
                onChange={(event) =>
                  handleChange("telefone", event.target.value)
                }
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="(11) 91234-5678"
                autoComplete="tel"
              />
              <p className="mt-2 text-sm text-gray-500">
                Aceitamos apenas celular com DDD e nono digito.
              </p>
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                E-mail
              </label>
              <input
                id="email"
                type="email"
                value={formulario.email}
                onChange={(event) => handleChange("email", event.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="voce@exemplo.com"
                autoComplete="email"
              />
            </div>

            <div>
              <label
                htmlFor="senha"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Senha
              </label>
              <input
                id="senha"
                type="password"
                value={formulario.senha}
                onChange={(event) => handleChange("senha", event.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Crie uma senha"
                autoComplete="new-password"
              />
            </div>

            <div>
              <label
                htmlFor="confirmarSenha"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Confirmar senha
              </label>
              <input
                id="confirmarSenha"
                type="password"
                value={formulario.confirmarSenha}
                onChange={(event) =>
                  handleChange("confirmarSenha", event.target.value)
                }
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Repita sua senha"
                autoComplete="new-password"
              />
            </div>

            {erro && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {erro}
              </div>
            )}

            <button
              type="submit"
              disabled={salvando}
              className="w-full rounded-lg bg-green-600 px-4 py-3 text-lg font-bold text-white transition-colors hover:bg-green-700 disabled:bg-gray-400"
            >
              {salvando ? "Salvando..." : "Salvar cadastro"}
            </button>

            <p className="text-center text-sm text-gray-600">
              Ja tem conta?{" "}
              <Link
                href="/login"
                className="font-semibold text-red-700 hover:text-red-800"
              >
                Entrar
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
