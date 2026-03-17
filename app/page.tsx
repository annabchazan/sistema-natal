import {
  listarCartinhas,
  listarCartinhasFiltradas,
} from "@/app/actions/cartinhas";
import { listarTags } from "@/app/actions/tags";
import { listarPontosEntrega } from "@/app/actions/pontosEntrega";
import ListaCartinhasHome from "@/app/components/ListaCartinhasHome";
import MapaPontosEntrega from "@/app/components/MapaPontosEntrega";

export default async function Home() {
  const cartinhas = await listarCartinhas();
  const pontosEntrega = await listarPontosEntrega();
  const tags = await listarTags();

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-green-50">
      <ListaCartinhasHome cartinhas={cartinhas} tags={tags} />

      <div className="container mx-auto px-4 py-12">
        <MapaPontosEntrega pontos={pontosEntrega} />
      </div>
    </div>
  );
}
