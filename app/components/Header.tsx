"use client";

import Link from "next/link";
import { useCarrinhoApadrinhamento } from "@/app/hooks/useCarrinhoApadrinhamento";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { logoutUsuario } from "@/app/actions/auth";

interface UsuarioMenu {
  id: number;
  nome: string;
  email: string;
  tipo: "admin" | "padrinho";
  admin_role?: "full" | "editor" | null;
}

export default function Header() {
  const { cartinhas, removerCartinha, limparCarrinho } =
    useCarrinhoApadrinhamento();
  const [isOpen, setIsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [usuario, setUsuario] = useState<UsuarioMenu | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const carregarUsuario = async () => {
      try {
        const resposta = await fetch("/api/auth/me", { cache: "no-store" });
        const dados = await resposta.json();
        setUsuario(dados.usuario);
      } catch (error) {
        console.error("Erro ao carregar sessao:", error);
        setUsuario(null);
      } finally {
        setIsLoaded(true);
      }
    };

    carregarUsuario();

    const atualizarSessao = () => {
      carregarUsuario();
    };

    window.addEventListener("auth-changed", atualizarSessao);

    return () => {
      window.removeEventListener("auth-changed", atualizarSessao);
    };
  }, []);

  const handleIrParaCheckout = () => {
    setIsOpen(false);
    router.push("/checkout");
  };

  const handleAbrirAreaUsuario = () => {
    setIsUserMenuOpen(false);
    router.push(usuario ? "/usuario" : "/cadastro");
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    limparCarrinho();
    await logoutUsuario();
    setUsuario(null);
    window.dispatchEvent(new Event("auth-changed"));
    setIsUserMenuOpen(false);
    setIsLoggingOut(false);
    router.push("/");
    router.refresh();
  };

  if (!isLoaded) return null;

  return (
    <>
      <header className="bg-brand text-white shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">Noelzinho Solidário</h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative z-50">
              <button
                onClick={() => setIsUserMenuOpen((prev) => !prev)}
                className="flex items-center justify-center bg-amber-600 hover:bg-amber-700 w-12 h-12 rounded-full transition-colors"
                aria-label={usuario ? "Abrir area do usuario" : "Abrir menu de acesso"}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="w-7 h-7"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 7a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm4 12a7 7 0 0 0-14 0"
                  />
                </svg>
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-[25px] bg-white text-gray-800 shadow-2xl border border-brand/20 p-2">
                  <button
                    onClick={handleAbrirAreaUsuario}
                    className="w-full text-left px-4 py-3 rounded-2xl hover:bg-orange-50 transition-colors"
                  >
                    <p className="font-semibold">
                      {usuario ? "Ver área do usuário" : "Cadastrar"}
                    </p>
                    <p className="text-sm text-gray-500">
                      {usuario
                        ? usuario.email
                        : "Crie seu cadastro para continuar."}
                    </p>
                  </button>

                  {usuario?.tipo === "admin" && (
                    <Link
                      href="/admin"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="block w-full text-left px-4 py-3 rounded-2xl hover:bg-orange-50 transition-colors"
                    >
                      <p className="font-semibold">Painel admin</p>
                      <p className="text-sm text-gray-500">
                        Abrir área administrativa.
                      </p>
                    </Link>
                  )}

                  {!usuario && (
                    <Link
                      href="/login"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="block w-full text-left px-4 py-3 rounded-2xl hover:bg-orange-50 transition-colors"
                    >
                      <p className="font-semibold">Entrar</p>
                      <p className="text-sm text-gray-500">
                        Acesse sua conta existente.
                      </p>
                    </Link>
                  )}

                  {usuario && (
                    <button
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                      className="w-full text-left px-4 py-3 rounded-2xl hover:bg-orange-50 transition-colors disabled:opacity-60"
                    >
                      <p className="font-semibold">
                        {isLoggingOut ? "Saindo..." : "Sair"}
                      </p>
                      <p className="text-sm text-gray-500">
                        Encerrar sessão com segurança.
                      </p>
                    </button>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={() => setIsOpen(!isOpen)}
              className="relative flex items-center gap-2 bg-amber-600 hover:bg-amber-700 px-4 py-2 rounded-full transition-colors"
            >
              <span className="font-semibold">
                {cartinhas.length > 0 ? cartinhas.length : "Carrinho"}
              </span>
              {cartinhas.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                  {cartinhas.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {isOpen && (
        <div className="fixed right-0 top-20 bg-white rounded-b-[25px] shadow-2xl border border-gray-200 w-96 max-h-96 flex flex-col z-50">
          <div className="bg-brand text-white p-4 flex items-center justify-between">
            <h3 className="text-lg font-bold">Cartinhas Apadrinhadas</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:text-gray-200 text-xl"
            >
              ×
            </button>
          </div>

          {cartinhas.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p className="text-sm">Nenhuma cartinha selecionada ainda</p>
            </div>
          ) : (
            <div className="overflow-y-auto flex-1 p-4 space-y-3">
              {cartinhas.map((cartinha) => (
                <div
                  key={cartinha.id}
                  className="border border-gray-200 rounded-[25px] p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-bold text-brand">
                        {cartinha.nome_crianca}
                      </h4>
                      <p className="text-xs text-gray-600 mt-1">
                        Idade: {cartinha.idade} anos
                      </p>
                      <p className="text-xs text-green-700 font-semibold mt-2">
                        {cartinha.presente_pedido}
                      </p>
                    </div>
                    <button
                      onClick={() => removerCartinha(cartinha.id)}
                      className="ml-2 text-brand hover:text-amber-600 font-bold"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {cartinhas.length > 0 && (
            <div className="border-t p-4 space-y-2">
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold">Total:</span>
                <span className="text-lg font-bold text-brand">
                  {cartinhas.length} cartinha{cartinhas.length !== 1 ? "s" : ""}
                </span>
              </div>
              <button
                onClick={handleIrParaCheckout}
                className="w-full bg-brand text-white border border-brand py-2 rounded-full font-semibold hover:bg-white hover:text-brand transition-colors"
              >
                Ir para Checkout
              </button>
              <button
                onClick={() => limparCarrinho()}
                className="w-full bg-white text-gray-600 border border-gray-200 py-2 rounded-full font-semibold hover:bg-gray-50 transition-colors"
              >
                Limpar Carrinho
              </button>
            </div>
          )}
        </div>
      )}

      {(isOpen || isUserMenuOpen) && (
        <div
          className="fixed inset-0 bg-black/20 z-30"
          onClick={() => {
            setIsOpen(false);
            setIsUserMenuOpen(false);
          }}
        />
      )}
    </>
  );
}
