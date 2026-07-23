import Link from "next/link";
import { listarCartinhas, contarCartinhasApadrinhadas } from "@/app/actions/cartinhas";
import { listarTags } from "@/app/actions/tags";
import { listarPontosEntrega } from "@/app/actions/pontosEntrega";
import ListaCartinhasHome from "@/app/components/ListaCartinhasHome";
import MapaPontosEntrega from "@/app/components/MapaPontosEntrega";

const PONTOS_ENTREGA_PREVIEW = 3;

export default async function Home() {
  const cartinhas = await listarCartinhas();
  const pontosEntrega = await listarPontosEntrega();
  const tags = await listarTags();
  const totalApadrinhadas = await contarCartinhasApadrinhadas();

  return (
    <div className="min-h-screen bg-cream pb-6">
      <ListaCartinhasHome
        cartinhas={cartinhas}
        tags={tags}
        totalApadrinhadas={totalApadrinhadas}
      />

      <div className="container mx-auto px-4 md:px-8 py-14 bg-cream-deep rounded-md">
        <h2 className="text-2xl font-bold text-center text-ink tracking-tight mb-8">
          Pontos de entrega
        </h2>
        <MapaPontosEntrega
          pontos={pontosEntrega.slice(0, PONTOS_ENTREGA_PREVIEW)}
        />
        {pontosEntrega.length > PONTOS_ENTREGA_PREVIEW && (
          <div className="text-center mt-8">
            <Link
              href="/pontos-entrega"
              className="inline-block bg-transparent text-ink border border-ink px-6 py-2.5 rounded font-semibold text-sm hover:bg-ink hover:text-white transition-colors"
            >
              Ver todos os pontos de entrega
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
