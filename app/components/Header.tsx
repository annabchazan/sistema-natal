"use client";

import Link from "next/link";
import Image from "next/image";
import { useCarrinhoApadrinhamento } from "@/app/hooks/useCarrinhoApadrinhamento";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { logoutUsuario } from "@/app/actions/auth";

interface UsuarioMenu {
  id: number;
  nome: string;
  email: string;
  tipo: "admin" | "padrinho";
  admin_role?: "master" | "full" | "editor" | null;
}

function IconeUsuario() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-[18px] h-[18px]">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
  );
}

function IconeEscudo() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-[18px] h-[18px]">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.286Z" />
    </svg>
  );
}

function IconeEntrar() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-[18px] h-[18px]">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3-6 3 3m0 0-3 3m3-3H9" />
    </svg>
  );
}

function IconeSair() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-[18px] h-[18px]">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 9V5.25A2.25 2.25 0 0 1 10.5 3h6a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 16.5 21h-6a2.25 2.25 0 0 1-2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12" />
    </svg>
  );
}

function IconeFechar(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={props.className ?? "w-4 h-4"}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  );
}

function IconeMenu() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
    </svg>
  );
}

function IconeSacolaVazia() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-9 h-9 mx-auto mb-2 text-stone-300">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007Z" />
    </svg>
  );
}

export default function Header() {
  const { cartinhas, removerCartinha, limparCarrinho } =
    useCarrinhoApadrinhamento();
  const [isOpen, setIsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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
      <header className="bg-cream text-ink border-b border-stone-200 sticky top-0 z-40 print:hidden">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-3 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3 flex-shrink-0">
            <span className="w-[7px] h-6 bg-brand flex-shrink-0" />
            <Image
              src="/logo-sempre-crianca.png"
              alt="Sempre Criança"
              width={36}
              height={36}
              className="h-9 w-auto"
            />
            <span className="text-sm font-bold tracking-tight hidden sm:inline">
              Natal Solidário
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-6 text-[13px] font-medium text-stone-600">
            <Link href="/quem-somos" className="relative py-1 hover:text-ink transition-colors after:content-[''] after:absolute after:left-0 after:-bottom-0.5 after:h-0.5 after:w-full after:origin-left after:scale-x-0 after:bg-brand after:transition-transform after:duration-300 hover:after:scale-x-100">Quem somos</Link>
            <Link href="/como-funciona" className="relative py-1 hover:text-ink transition-colors after:content-[''] after:absolute after:left-0 after:-bottom-0.5 after:h-0.5 after:w-full after:origin-left after:scale-x-0 after:bg-brand after:transition-transform after:duration-300 hover:after:scale-x-100">Como funciona</Link>
            <Link href="/duvidas-frequentes" className="relative py-1 hover:text-ink transition-colors after:content-[''] after:absolute after:left-0 after:-bottom-0.5 after:h-0.5 after:w-full after:origin-left after:scale-x-0 after:bg-brand after:transition-transform after:duration-300 hover:after:scale-x-100">Dúvidas frequentes</Link>
            <Link href="/pontos-entrega" className="relative py-1 hover:text-ink transition-colors after:content-[''] after:absolute after:left-0 after:-bottom-0.5 after:h-0.5 after:w-full after:origin-left after:scale-x-0 after:bg-brand after:transition-transform after:duration-300 hover:after:scale-x-100">Pontos de entrega</Link>
          </nav>

          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              onClick={() => {
                setIsMobileMenuOpen((prev) => !prev);
                setIsOpen(false);
                setIsUserMenuOpen(false);
              }}
              className="lg:hidden flex items-center justify-center w-9 h-9 rounded-full border border-stone-300 text-stone-600 hover:border-ink hover:text-ink transition-colors"
              aria-label={isMobileMenuOpen ? "Fechar menu" : "Abrir menu"}
            >
              {isMobileMenuOpen ? <IconeFechar className="w-4 h-4" /> : <IconeMenu />}
            </button>

            <div className="relative z-50">
              <button
                onClick={() => {
                  setIsUserMenuOpen((prev) => !prev);
                  setIsOpen(false);
                }}
                className="flex items-center justify-center w-9 h-9 rounded-full border border-ink text-ink hover:bg-ink hover:text-white transition-colors"
                aria-label={usuario ? "Abrir area do usuario" : "Abrir menu de acesso"}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="w-4 h-4"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 20c0-4.4 3.6-7 8-7s8 2.6 8 7" />
                </svg>
              </button>

              <div
                className={`absolute right-0 mt-2 w-60 origin-top-right rounded-md bg-white text-ink shadow-[0_8px_24px_rgba(30,27,23,.10)] border border-stone-200 p-1 transition-all duration-150 ease-out ${
                  isUserMenuOpen
                    ? "opacity-100 scale-100"
                    : "opacity-0 scale-95 pointer-events-none"
                }`}
              >
                {usuario && (
                  <div className="px-4 py-3 border-b border-stone-100 mb-1">
                    <p className="font-semibold text-sm text-ink truncate">
                      Olá, {usuario.nome.split(" ")[0]}
                    </p>
                    <p className="text-xs text-stone-400 truncate">
                      {usuario.email}
                    </p>
                  </div>
                )}

                <button
                  onClick={handleAbrirAreaUsuario}
                  className="w-full flex items-center gap-3 text-left px-4 py-3 rounded hover:bg-cream-deep transition-colors"
                >
                  <span className="text-stone-400 shrink-0">
                    <IconeUsuario />
                  </span>
                  <span>
                    <p className="font-semibold text-sm">
                      {usuario ? "Ver área do usuário" : "Cadastrar"}
                    </p>
                    <p className="text-xs text-stone-400">
                      {usuario
                        ? "Acompanhe seus apadrinhamentos."
                        : "Crie seu cadastro para continuar."}
                    </p>
                  </span>
                </button>

                {usuario?.tipo === "admin" && (
                  <Link
                    href="/admin"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center gap-3 w-full text-left px-4 py-3 rounded hover:bg-cream-deep transition-colors"
                  >
                    <span className="text-stone-400 shrink-0">
                      <IconeEscudo />
                    </span>
                    <span>
                      <p className="font-semibold text-sm text-ink">Painel admin</p>
                      <p className="text-xs text-stone-400">
                        Abrir área administrativa.
                      </p>
                    </span>
                  </Link>
                )}

                {!usuario && (
                  <Link
                    href="/login"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center gap-3 w-full text-left px-4 py-3 rounded hover:bg-cream-deep transition-colors"
                  >
                    <span className="text-stone-400 shrink-0">
                      <IconeEntrar />
                    </span>
                    <span>
                      <p className="font-semibold text-sm text-ink">Entrar</p>
                      <p className="text-xs text-stone-400">
                        Acesse sua conta existente.
                      </p>
                    </span>
                  </Link>
                )}

                {usuario && (
                  <>
                    <div className="my-1 border-t border-stone-100" />
                    <button
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                      className="flex items-center gap-3 w-full text-left px-4 py-3 rounded hover:bg-vermelho-natal/5 transition-colors disabled:opacity-60"
                    >
                      <span className="text-vermelho-natal shrink-0">
                        <IconeSair />
                      </span>
                      <span>
                        <p className="font-semibold text-sm text-vermelho-natal">
                          {isLoggingOut ? "Saindo..." : "Sair"}
                        </p>
                        <p className="text-xs text-stone-400">
                          Encerrar sessão com segurança.
                        </p>
                      </span>
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="relative">
              <button
                onClick={() => {
                  setIsOpen((prev) => !prev);
                  setIsUserMenuOpen(false);
                }}
                className="relative flex items-center gap-2 border border-ink rounded px-3.5 py-1.5 text-[13px] font-semibold hover:bg-ink hover:text-white transition-colors"
              >
                Carrinho
                {cartinhas.length > 0 && (
                  <span className="bg-ink text-white group-hover:bg-white text-[10.5px] font-bold rounded-full w-4 h-4 flex items-center justify-center shrink-0">
                    {cartinhas.length}
                  </span>
                )}
              </button>

              <div
                className={`absolute right-0 mt-2 w-96 max-w-[calc(100vw-2rem)] origin-top-right bg-white rounded-md shadow-[0_8px_24px_rgba(30,27,23,.10)] border border-stone-200 max-h-96 flex flex-col z-50 transition-all duration-150 ease-out ${
                  isOpen
                    ? "opacity-100 scale-100"
                    : "opacity-0 scale-95 pointer-events-none"
                }`}
              >
                <div className="p-4 border-b border-stone-100 flex items-center justify-between">
                  <h3 className="text-[13.5px] font-bold text-ink">Cartinhas escolhidas</h3>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-stone-400 hover:text-ink"
                  >
                    <IconeFechar className="w-4 h-4" />
                  </button>
                </div>

                {cartinhas.length === 0 ? (
                  <div className="p-8 text-center text-stone-400">
                    <IconeSacolaVazia />
                    <p className="text-[12.5px]">Nenhuma cartinha selecionada ainda</p>
                  </div>
                ) : (
                  <div className="overflow-y-auto flex-1 p-4 space-y-3">
                    {cartinhas.map((cartinha) => (
                      <div
                        key={cartinha.id}
                        className="border border-stone-200 rounded-md p-3 bg-cream-deep"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-bold text-ink text-sm">
                              {cartinha.nome_crianca}
                            </h4>
                            <p className="text-xs text-stone-400 mt-1">
                              Idade: {cartinha.idade} anos
                            </p>
                            <p className="text-xs text-stone-600 font-semibold mt-2">
                              {cartinha.presente_pedido}
                            </p>
                          </div>
                          <button
                            onClick={() => removerCartinha(cartinha.id)}
                            className="ml-2 text-stone-400 hover:text-vermelho-natal"
                          >
                            <IconeFechar className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {cartinhas.length > 0 && (
                  <div className="border-t border-stone-100 p-4 space-y-2">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-sm text-ink">Total:</span>
                      <span className="text-sm font-bold text-ink">
                        {cartinhas.length} cartinha{cartinhas.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <button
                      onClick={handleIrParaCheckout}
                      className="w-full bg-ink text-white border border-ink py-2 rounded font-semibold text-sm hover:bg-white hover:text-ink transition-colors"
                    >
                      Ir para Checkout
                    </button>
                    <button
                      onClick={() => limparCarrinho()}
                      className="w-full bg-white text-stone-500 border border-stone-200 py-2 rounded font-semibold text-sm hover:bg-cream-deep transition-colors"
                    >
                      Limpar Carrinho
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {isMobileMenuOpen && (
          <nav className="lg:hidden border-t border-stone-200 px-4 py-3 flex flex-col gap-1 text-sm font-medium text-stone-600">
            <Link
              href="/quem-somos"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-2 py-2.5 rounded hover:bg-cream-deep hover:text-ink transition-colors"
            >
              Quem somos
            </Link>
            <Link
              href="/como-funciona"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-2 py-2.5 rounded hover:bg-cream-deep hover:text-ink transition-colors"
            >
              Como funciona
            </Link>
            <Link
              href="/duvidas-frequentes"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-2 py-2.5 rounded hover:bg-cream-deep hover:text-ink transition-colors"
            >
              Dúvidas frequentes
            </Link>
            <Link
              href="/pontos-entrega"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-2 py-2.5 rounded hover:bg-cream-deep hover:text-ink transition-colors"
            >
              Pontos de entrega
            </Link>
          </nav>
        )}
      </header>

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
