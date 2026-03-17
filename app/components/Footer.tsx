"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-red-700 text-white mt-16">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo e descrição */}
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-2xl font-bold mb-4 text-yellow-300">
              🎄 Sistema Natal
            </h3>
            <p className="text-red-100 mb-4">
              Conectando corações através do apadrinhamento de cartinhas de
              Natal. Faça a diferença na vida de uma criança este ano!
            </p>
            <div className="flex space-x-4">
              <a
                href="#"
                className="text-red-200 hover:text-white transition-colors"
                aria-label="Facebook"
              >
                📘 Facebook
              </a>
              <a
                href="#"
                className="text-red-200 hover:text-white transition-colors"
                aria-label="Instagram"
              >
                📷 Instagram
              </a>
              <a
                href="#"
                className="text-red-200 hover:text-white transition-colors"
                aria-label="Twitter"
              >
                🐦 Twitter
              </a>
            </div>
          </div>

          {/* Links rápidos */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-yellow-300">
              Links Rápidos
            </h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/quem-somos"
                  className="text-red-200 hover:text-white transition-colors"
                >
                  Quem Somos
                </Link>
              </li>
              <li>
                <Link
                  href="/como-funciona"
                  className="text-red-200 hover:text-white transition-colors"
                >
                  Como Funciona
                </Link>
              </li>
              <li>
                <Link
                  href="/duvidas-frequentes"
                  className="text-red-200 hover:text-white transition-colors"
                >
                  Dúvidas Frequentes
                </Link>
              </li>
              <li>
                <Link
                  href="/pontos-entrega"
                  className="text-red-200 hover:text-white transition-colors"
                >
                  Pontos de Entrega
                </Link>
              </li>
            </ul>
          </div>

          {/* Contato */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-yellow-300">
              Contato
            </h4>
            <div className="space-y-2 text-red-200">
              <p>📧 contato@sistemanatal.com.br</p>
              <p>📞 (11) 9999-9999</p>
              <p>📍 São Paulo, SP</p>
            </div>
          </div>
        </div>

        {/* Linha divisória */}
        <div className="border-t border-red-600 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-red-200 text-sm">
              © 2024 Sistema Natal. Todos os direitos reservados.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link
                href="/privacidade"
                className="text-red-200 hover:text-white text-sm transition-colors"
              >
                Política de Privacidade
              </Link>
              <Link
                href="/termos"
                className="text-red-200 hover:text-white text-sm transition-colors"
              >
                Termos de Uso
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
