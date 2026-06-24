import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import WhatsAppButton from "@/app/components/WhatsAppButton";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Noelzinho Solidário - Apadrinhamento de Cartinhas",
  description:
    "Uma iniciativa do Projeto Sempre Criança. Conectando padrinhos a crianças de Niterói e São Gonçalo através do apadrinhamento de cartinhas de Natal.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${poppins.variable} antialiased min-h-screen flex flex-col`}
      >
        <Header />
        <main className="grow">{children}</main>
        <Footer />
        <WhatsAppButton />
      </body>
    </html>
  );
}
