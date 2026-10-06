import { getImageProps } from "next/image";

// Arte do título das páginas de conteúdo. O texto "Título" já está na imagem;
// cada página mantém um h1 sr-only para leitores de tela e SEO.
// <picture> faz o navegador baixar só a versão do tamanho de tela dele.
export default function BannerPagina({ nome, alt }: { nome: string; alt: string }) {
  const comum = { alt, priority: true, sizes: "100vw" };
  const { props: desktop } = getImageProps({
    ...comum,
    src: `/banners/${nome}-desktop.png`,
    width: 1920,
    height: 360,
  });
  const { props: mobile } = getImageProps({
    ...comum,
    src: `/banners/${nome}-mobile.png`,
    width: 1170,
    height: 660,
  });

  return (
    <picture>
      {/* images.unoptimized não gera srcSet; cai para a própria URL. */}
      <source media="(min-width: 640px)" srcSet={desktop.srcSet ?? desktop.src} />
      <img {...mobile} alt={alt} loading="eager" fetchPriority="high" className="block w-full h-auto" />
    </picture>
  );
}
