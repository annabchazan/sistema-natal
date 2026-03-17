"use client";

import { useEffect, useRef, useState } from "react";

interface PontoEntrega {
  id: number;
  nome_local: string;
  endereco: string;
  horario: string;
  latitude?: number;
  longitude?: number;
}

interface MapaPontosEntregaProps {
  pontos: PontoEntrega[];
}

export default function MapaPontosEntrega({ pontos }: MapaPontosEntregaProps) {
  const [isClient, setIsClient] = useState(false);
  const [mapError, setMapError] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Função para geocodificar endereço (simplificada)
  const getCoordinates = (endereco: string): [number, number] => {
    // Por enquanto, retorna coordenadas aleatórias próximas ao centro
    // Em produção, você usaria uma API de geocodificação
    const baseLat = -23.5505;
    const baseLng = -46.6333;
    const randomLat = baseLat + (Math.random() - 0.5) * 0.1;
    const randomLng = baseLng + (Math.random() - 0.5) * 0.1;
    return [randomLat, randomLng];
  };

  if (!isClient) {
    return (
      <div className="w-full h-96 bg-gray-200 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando mapa...</p>
        </div>
      </div>
    );
  }

  if (mapError) {
    return (
      <div className="w-full">
        <h2 className="text-2xl font-bold text-center text-red-700 mb-6">
          🗺️ Pontos de Doação
        </h2>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <p className="text-yellow-800 mb-4">
            Não foi possível carregar o mapa interativo. Aqui estão os pontos de
            entrega:
          </p>
          {/* Lista alternativa */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pontos.map((ponto) => (
              <div
                key={ponto.id}
                className="bg-white rounded-lg shadow-md p-4 border-l-4 border-green-500"
              >
                <h3 className="font-bold text-green-700 mb-2">
                  {ponto.nome_local}
                </h3>
                <p className="text-sm text-gray-600 mb-1">
                  📍 {ponto.endereco}
                </p>
                <p className="text-sm text-gray-600">🕒 {ponto.horario}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <h2 className="text-2xl font-bold text-center text-red-700 mb-6">
        🗺️ Pontos de Doação
      </h2>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <MapRenderer pontos={pontos} onError={() => setMapError(true)} />
      </div>

      {/* Lista alternativa para mobile */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {pontos.map((ponto) => (
          <div
            key={ponto.id}
            className="bg-white rounded-lg shadow-md p-4 border-l-4 border-green-500"
          >
            <h3 className="font-bold text-green-700 mb-2">
              {ponto.nome_local}
            </h3>
            <p className="text-sm text-gray-600 mb-1">📍 {ponto.endereco}</p>
            <p className="text-sm text-gray-600">🕒 {ponto.horario}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function MapRenderer({
  pontos,
  onError,
}: {
  pontos: PontoEntrega[];
  onError: () => void;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const leafletRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const initializeMap = async () => {
      try {
        if (!mapRef.current || mapInstanceRef.current) return;

        // Carregar Leaflet
        const L = (await import("leaflet")).default;
        leafletRef.current = L;

        // Configurar ícones padrão
        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl:
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
          iconUrl:
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
          shadowUrl:
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
        });

        // Criar mapa
        const map = L.map(mapRef.current, {
          center: [-23.5505, -46.6333], // São Paulo
          zoom: 10,
          zoomControl: true,
          scrollWheelZoom: true,
        });

        // Adicionar tile layer
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(map);

        mapInstanceRef.current = map;

        if (isMounted) {
          setIsLoaded(true);
        }
      } catch (error) {
        console.error("Erro ao inicializar mapa:", error);
        if (isMounted) {
          onError();
        }
      }
    };

    initializeMap();

    return () => {
      isMounted = false;
      // Limpar mapa quando componente for desmontado
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      // Limpar marcadores
      markersRef.current.forEach((marker) => {
        if (marker) marker.remove();
      });
      markersRef.current = [];
    };
  }, []); // Removido onError das dependências

  // Atualizar marcadores quando pontos mudarem
  useEffect(() => {
    if (!mapInstanceRef.current || !isLoaded || !leafletRef.current) return;

    const L = leafletRef.current;

    // Remover marcadores existentes
    markersRef.current.forEach((marker) => {
      if (marker) marker.remove();
    });
    markersRef.current = [];

    // Adicionar novos marcadores
    pontos.forEach((ponto) => {
      const coordinates = getCoordinates(ponto.endereco);

      const marker = L.marker(coordinates).addTo(mapInstanceRef.current);

      marker.bindPopup(`
        <div class="p-2">
          <h3 class="font-bold text-red-700">${ponto.nome_local}</h3>
          <p class="text-sm text-gray-600 mt-1">📍 ${ponto.endereco}</p>
          <p class="text-sm text-gray-600">🕒 ${ponto.horario}</p>
        </div>
      `);

      markersRef.current.push(marker);
    });
  }, [pontos, isLoaded]);

  // Função para geocodificar endereço (simplificada)
  const getCoordinates = (endereco: string): [number, number] => {
    const baseLat = -23.5505;
    const baseLng = -46.6333;
    const randomLat = baseLat + (Math.random() - 0.5) * 0.1;
    const randomLng = baseLng + (Math.random() - 0.5) * 0.1;
    return [randomLat, randomLng];
  };

  if (!isLoaded) {
    return (
      <div className="w-full h-96 bg-gray-200 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Renderizando mapa...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={mapRef}
      className="w-full h-96 rounded-lg"
      style={{ height: "400px" }}
    />
  );
}
