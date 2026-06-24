"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-amber-600 text-white mt-16">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-2xl font-bold mb-4 text-yellow-300">
              Noelzinho Solidário
            </h3>
            <p className="text-white/80 mb-4">
              Uma iniciativa do Projeto Sempre Criança. Conectando padrinhos a
              crianças de Niterói e São Gonçalo através do apadrinhamento de
              cartinhas de Natal.
            </p>
            <div className="flex space-x-4">
              <a
                href="https://www.facebook.com/semprecrianca/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/70 hover:text-white transition-colors"
              >
                Facebook
              </a>
              <a
                href="https://www.instagram.com/projetosemprecrianca/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/70 hover:text-white transition-colors"
              >
                Instagram
              </a>
              <a
                href="https://www.youtube.com/channel/UC4iKh2GpjG99VL6225el2BA"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/70 hover:text-white transition-colors"
              >
                YouTube
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4 text-yellow-300">
              Links Rápidos
            </h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/quem-somos"
                  className="text-white/70 hover:text-white transition-colors"
                >
                  Quem Somos
                </Link>
              </li>
              <li>
                <Link
                  href="/como-funciona"
                  className="text-white/70 hover:text-white transition-colors"
                >
                  Como Funciona
                </Link>
              </li>
              <li>
                <Link
                  href="/duvidas-frequentes"
                  className="text-white/70 hover:text-white transition-colors"
                >
                  Dúvidas Frequentes
                </Link>
              </li>
              <li>
                <Link
                  href="/pontos-entrega"
                  className="text-white/70 hover:text-white transition-colors"
                >
                  Pontos de Entrega
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4 text-yellow-300">
              Contato
            </h4>
            <div className="space-y-2 text-white/70">
              <p>contato@semprecrianca.com.br</p>
              <p>(21) 99999-9999</p>
              <p>Av. Rui Barbosa, 738 - loft 2</p>
              <p>São Francisco, Niterói - RJ</p>
            </div>
          </div>
        </div>

        <div className="border-t border-white/20 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-white/70 text-sm">
              © 2025 Projeto Sempre Criança. Todos os direitos reservados.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link
                href="/privacidade"
                className="text-white/70 hover:text-white text-sm transition-colors"
              >
                Política de Privacidade
              </Link>
              <Link
                href="/termos"
                className="text-white/70 hover:text-white text-sm transition-colors"
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
