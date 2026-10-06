import { listarPontosEntrega } from "@/app/actions/pontosEntrega";
import BarraPagina from "@/app/components/BarraPagina";
import BannerPagina from "@/app/components/BannerPagina";
import MapaPontosEntrega from "@/app/components/MapaPontosEntrega";

export default async function PontosEntrega() {
  const pontos = await listarPontosEntrega();

  return (
    <div className="min-h-full bg-cream">
      <BannerPagina nome="pontos-de-entrega" alt="Natal Solidário, Sempre Criança — Pontos de entrega" />
      <BarraPagina href="/" rotulo="Ver cartinhas">
        Já escolheu a cartinha? Confira o prazo de entrega indicado nela.
      </BarraPagina>
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-14">
        <h1 className="sr-only">
          Pontos de entrega
        </h1>
        <p className="text-center text-stone-500 text-sm mb-7">
          Leve o presente até um dos locais abaixo, dentro do prazo indicado na cartinha
        </p>

        <div className="flex items-center gap-3 border-l-[3px] border-brand bg-white px-4.5 py-3.5 text-[13px] text-stone-600 max-w-3xl mx-auto mb-7">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="w-5 h-5 shrink-0 text-brand-dark"
            stroke="currentColor"
            strokeWidth="1.6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 11.25v8.25a1.5 1.5 0 0 1-1.5 1.5H4.5a1.5 1.5 0 0 1-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 1 0 9.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1 1 14.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z"
            />
          </svg>
          <span>Identifique o presente com o número da cartinha e o nome da criança. Não leve o presente embrulhado — a equipe confere o conteúdo antes de embrulhar. Se possível, traga também o papel de presente para a gente embalar.</span>
        </div>

        <div className="mb-12">
          <MapaPontosEntrega pontos={pontos} />
        </div>

        <div className="bg-white border border-stone-200 rounded-md p-6 max-w-3xl mx-auto">
          <h3 className="text-sm font-bold text-ink mb-4">
            Informações importantes
          </h3>
          <ul className="space-y-2 text-[13px] text-stone-500">
            <li>• Leve identificação ao entregar os presentes</li>
            <li>• Os pontos de entrega funcionam apenas nos horários especificados</li>
            <li>• Não embrulhe o presente — leve o papel de presente à parte para a equipe embalar</li>
            <li>• Anote o número da cartinha para facilitar a identificação</li>
            <li>• Em caso de dúvidas, ligue para o ponto de entrega</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
