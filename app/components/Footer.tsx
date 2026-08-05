"use client";

import Link from "next/link";
import Image from "next/image";

function IconeEmail() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-3.5 h-3.5 shrink-0">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
    </svg>
  );
}

function IconeWhatsApp() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 shrink-0">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
    </svg>
  );
}

export default function Footer() {
  return (
    <footer className="bg-ink text-white print:hidden">
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr] gap-10">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Image
                src="/logo_rodape_corrigida_transparente.png"
                alt="Sempre Criança"
                width={32}
                height={32}
                className="h-12 w-auto"
              />
              <span className="font-bold text-[15px]">Natal Solidário</span>
            </div>
            <p className="text-stone-400 text-[13px] leading-7 mb-3 max-w-sm">
              Uma iniciativa do Projeto Sempre Criança que aproxima pessoas e
              histórias, levando carinho e alegria para crianças de Niterói e
              São Gonçalo por meio do apadrinhamento de cartinhas de Natal.
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
            <h2 className="font-bold text-[13px] mb-4">Links rápidos</h2>
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
            <h2 className="font-bold text-[13px] mb-4">Contato</h2>
            <div className="space-y-2 text-[13px] text-stone-400 leading-6">
              <a
                href="mailto:contato@semprecrianca.org"
                className="flex text-brand items-center gap-2 hover:text-white transition-colors"
              >
                <IconeEmail />
                contato@semprecrianca.org
              </a>
              <Link
                href="https://api.whatsapp.com/send/?phone=5521995720162&text&type=phone_number&app_absent=0"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-brand hover:text-white transition-colors"
              >
                <IconeWhatsApp />
                (21) 99572-0162
              </Link>
              {/* <p>Av. Rui Barbosa, 738 - loft 2</p>
              <p>São Francisco, Niterói - RJ</p> */}
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 mt-10 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-3 text-[12px] text-stone-400">
            <p>© 2026 Projeto Sempre Criança. Todos os direitos reservados.</p>
            <div className="flex items-center gap-2">
              <span>Desenvolvido por:</span>
              <a href="https://chazantech.com.br/" target="_blank" rel="noopener noreferrer">
                <Image
                  src="/logo-dark.png"
                  alt="Chazan Tech"
                  width={974}
                  height={142}
                  className="h-4 w-auto"
                />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
