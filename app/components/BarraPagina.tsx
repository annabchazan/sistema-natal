import Link from "next/link";
import type { ReactNode } from "react";

// Barra marrom logo abaixo do banner: separa a arte do conteúdo e leva para o próximo passo.
export default function BarraPagina({
  children,
  rotulo,
  href,
  externo = false,
}: {
  children: ReactNode;
  rotulo: string;
  href: string;
  externo?: boolean;
}) {
  const classe =
    "group block sm:flex sm:items-center sm:justify-center sm:gap-4 bg-brown text-white text-center leading-snug px-4 py-2 sm:py-3 hover:bg-brown-dark transition-colors";
  const conteudo = (
    <>
      <span className="text-[12.5px] sm:text-sm">{children}</span>
      <span className="ml-1 sm:ml-0 inline-flex items-center gap-1 text-[12px] sm:text-[12.5px] font-bold text-brand whitespace-nowrap group-hover:underline">
        {rotulo} →
      </span>
    </>
  );

  return externo ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={classe}>
      {conteudo}
    </a>
  ) : (
    <Link href={href} className={classe}>
      {conteudo}
    </Link>
  );
}
