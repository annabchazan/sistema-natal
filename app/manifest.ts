import type { MetadataRoute } from "next";

// Instalável no celular. Sem service worker de propósito: nada de página em cache
// no aparelho (cartinhas e status mudam o tempo todo) — o app instalado sempre
// busca a versão atual no servidor.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Natal Solidário - Apadrinhamento de Cartinhas",
    short_name: "Natal Solidário",
    description:
      "Uma iniciativa do Projeto Sempre Criança. Conectando padrinhos a crianças de Niterói e São Gonçalo através do apadrinhamento de cartinhas de Natal.",
    lang: "pt-BR",
    start_url: "/",
    scope: "/",
    display: "standalone",
    // --color-page e --color-brand (globals.css).
    background_color: "#FAF8F5",
    theme_color: "#F8991D",
    icons: [
      { src: "/pwa-192.png", sizes: "192x192", type: "image/png" },
      { src: "/pwa-512.png", sizes: "512x512", type: "image/png" },
      { src: "/pwa-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
