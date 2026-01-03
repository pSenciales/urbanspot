// src/app/page.tsx

"use client";

import UrbanMap from '@/components/map/UrbanMap';

export default function Home() {

  const handleMapClick = (coords: { lat: number; lon: number }) => {
    console.log("¡Clic en el mapa!", coords);
    // Aquí después añadirás lógica para abrir Dialog y crear POI
  };

  return (
    <main className="flex h-full w-full overflow-hidden">
      <div className="flex-grow relative h-full">
        <UrbanMap onMapClick={handleMapClick} />
      </div>
    </main>
  );
}