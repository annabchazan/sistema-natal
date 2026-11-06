import { redirect } from "next/navigation";
import { getUsuarioAutenticado } from "@/lib/auth";
import { precisaAceitarPolitica } from "@/lib/politica";
import { caminhoInternoSeguro } from "@/app/utils/redirecionamento";
import AceiteForm from "./AceiteForm";

interface Props {
  searchParams: Promise<{ next?: string }>;
}

// Tela mostrada a quem entrou sem ter aceitado a versão atual da Política. Não mexe no
// localStorage: o carrinho de quem estava indo para o checkout continua intacto.
export default async function AceitarPoliticaPage({ searchParams }: Props) {
  const { next } = await searchParams;
  const usuario = await getUsuarioAutenticado();

  // Aqui não usa requireUsuarioAutenticado (ele redirecionaria de volta pra cá).
  if (!usuario) {
    redirect("/login");
  }

  const destino = caminhoInternoSeguro(next) ?? (usuario.tipo === "admin" ? "/admin" : "/usuario");

  // Já aceitou a versão atual: segue direto, sem ver a tela.
  if (!precisaAceitarPolitica(usuario)) {
    redirect(destino);
  }

  return (
    <div className="min-h-full bg-cream py-14 flex items-center justify-center">
      <div className="max-w-110 mx-auto px-4">
        <div className="bg-white border border-stone-200 border-t-[3px] border-t-brand rounded-md overflow-hidden">
          <div className="px-8 pt-8 pb-6 border-b border-stone-100">
            <h1 className="text-[19px] font-bold text-ink">Política de Privacidade</h1>
            <p className="mt-1 text-[13px] text-stone-500">
              Para continuar usando o Natal Solidário, precisamos do seu aceite da nossa Política de
              Privacidade.
            </p>
          </div>
          <AceiteForm destino={destino} />
        </div>
      </div>
    </div>
  );
}
