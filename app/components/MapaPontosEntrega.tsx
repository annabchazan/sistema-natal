interface PontoEntrega {
  id: number;
  nome_local: string;
  endereco: string;
  horario: string;
}

interface MapaPontosEntregaProps {
  pontos: PontoEntrega[];
}

export default function MapaPontosEntrega({ pontos }: MapaPontosEntregaProps) {
  return (
    <div className="w-full">
      {pontos.length === 0 ? (
        <div className="bg-white border border-stone-200 rounded-md p-8 text-center">
          <p className="text-stone-500 text-base">
            Nenhum ponto de entrega cadastrado no momento.
          </p>
          <p className="text-stone-400 text-sm mt-2">
            Em breve novos pontos serão adicionados.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
          {pontos.map((ponto) => (
            <div
              key={ponto.id}
              className="flex flex-col bg-white border border-stone-200 border-t-[3px] border-t-brand rounded-md p-5 transition-shadow hover:shadow-[0_8px_24px_rgba(30,27,23,.08)]"
            >
              <h3 className="font-bold text-[15px] text-ink mb-3">
                {ponto.nome_local}
              </h3>

              <div className="flex items-start gap-2 text-[13px] text-stone-500 mb-2">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="w-4 h-4 mt-0.5 shrink-0 text-stone-400"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
                  />
                </svg>
                <span>{ponto.endereco}</span>
              </div>

              <div className="flex items-center gap-2 text-[13px] text-brand-dark font-semibold mb-4">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="w-4 h-4 shrink-0"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                  />
                </svg>
                <span>{ponto.horario}</span>
              </div>

              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  `${ponto.nome_local}, ${ponto.endereco}`,
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group mt-auto inline-flex items-center gap-1 text-[12.5px] font-semibold text-ink hover:text-brand-dark transition-colors"
              >
                Como chegar
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m9 5 7 7-7 7"
                  />
                </svg>
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
