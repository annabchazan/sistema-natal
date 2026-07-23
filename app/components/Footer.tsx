"use client";

import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="bg-ink text-white print:hidden">
      <div className="container mx-auto px-4 md:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr] gap-10 max-w-6xl mx-auto">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Image
                src="/logo-sempre-crianca.png"
                alt="Sempre Criança"
                width={32}
                height={32}
                className="h-8 w-auto"
              />
              <span className="font-bold text-[15px]">Natal Solidário</span>
            </div>
            <p className="text-stone-400 text-[13px] leading-7 mb-3 max-w-sm">
              Uma iniciativa do Projeto Sempre Criança. Conectando padrinhos a
              crianças de Niterói e São Gonçalo através do apadrinhamento de
              cartinhas de Natal.
            </p>
            <div className="flex gap-4 text-[13px] text-stone-400">
              <a
                href="https://www.facebook.com/semprecrianca/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand hover:text-white transition-colors"
              >
                Facebook
              </a>
              <a
                href="https://www.instagram.com/projetosemprecrianca/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand hover:text-white transition-colors"
              >
                Instagram
              </a>
              <a
                href="https://www.youtube.com/channel/UC4iKh2GpjG99VL6225el2BA"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand hover:text-white transition-colors"
              >
                YouTube
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-[13px] mb-4">Links rápidos</h4>
            <ul className="space-y-2 text-[13px] text-stone-400">
              <li>
                <Link href="/quem-somos" className="text-brand hover:text-white transition-colors">
                  Quem somos
                </Link>
              </li>
              <li>
                <Link href="/como-funciona" className="text-brand hover:text-white transition-colors">
                  Como funciona
                </Link>
              </li>
              <li>
                <Link href="/duvidas-frequentes" className="text-brand hover:text-white transition-colors">
                  Dúvidas frequentes
                </Link>
              </li>
              <li>
                <Link href="/pontos-entrega" className="text-brand hover:text-white transition-colors">
                  Pontos de entrega
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-[13px] mb-4">Contato</h4>
            <div className="space-y-2 text-[13px] text-stone-400 leading-6">
              <p>contato@semprecrianca.com.br</p>
              <p>(21) 99999-9999</p>
              <p>Av. Rui Barbosa, 738 - loft 2</p>
              <p>São Francisco, Niterói - RJ</p>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 mt-10 pt-6 max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-3 text-[12px] text-stone-400">
            <p>© 2026 Projeto Sempre Criança. Todos os direitos reservados.</p>
            <div className="flex gap-6">
              <Link href="/privacidade" className="text-brand hover:text-white transition-colors">
                Política de Privacidade
              </Link>
              <Link href="/termos" className="text-brand hover:text-white transition-colors">
                Termos de Uso
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
