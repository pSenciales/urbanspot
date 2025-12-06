// src/app/page.tsx

import MapLoader from '@/components/map/MapLoader'; // (Ruta actualizada)
import { HeaderMenu } from '@/components/layout/HeaderMenu'; // 1. Importa el menú

export default function Home() {
  
  return (
    
    <main className="flex flex-col h-screen w-screen">
      
      <header className="bg-white shadow-md p-4 z-10 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">🏙️ UrbanSpot</h1>
        
        <HeaderMenu />
      </header>

      {/*Renderizar el Mapa */}
      <div className="flex-grow relative">
        <MapLoader />
      </div>

    </main>
  );
}