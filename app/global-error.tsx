"use client";

import { Poppins } from "next/font/google";
import "./globals.css";
import TelaErro from "@/app/components/TelaErro";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

// Erros no layout raiz (ex.: banco fora do ar ao buscar a sessão): substitui o layout
// inteiro, por isso precisa do próprio <html>, <body>, fonte e CSS.
export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <html lang="pt-BR">
      <body className={`${poppins.variable} antialiased min-h-screen bg-cream`}>
        <title>Algo deu errado - Natal Solidário</title>
        <TelaErro error={error} retry={retry} />
      </body>
    </html>
  );
}
