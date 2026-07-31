import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import WhatsAppButton from "@/app/components/WhatsAppButton";
import { ToastProvider } from "@/app/components/Toast";
import { getUsuarioAutenticado } from "@/lib/auth";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Natal Solidário - Apadrinhamento de Cartinhas",
  description:
    "Uma iniciativa do Projeto Sempre Criança. Conectando padrinhos a crianças de Niterói e São Gonçalo através do apadrinhamento de cartinhas de Natal.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const usuario = await getUsuarioAutenticado();

  return (
    <html lang="pt-BR">
      <body
        className={`${poppins.variable} antialiased min-h-screen flex flex-col`}
      >
        <ToastProvider>
          <Header usuario={usuario} />
          <main className="grow">{children}</main>
          <Footer />
          <WhatsAppButton />
        </ToastProvider>
      </body>
    </html>
  );
}
