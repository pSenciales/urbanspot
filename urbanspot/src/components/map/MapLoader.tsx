// src/app/components/MapLoader.tsx

"use client";

import dynamic from 'next/dynamic';
import { useMemo } from 'react';

type Coords = {
  lat: number;
  lon: number;
};

export default function MapLoader() {
  const UrbanMap = useMemo(() => dynamic(
    () => import('@/components/map/UrbanMap'),
    { 
      loading: () => <p>Cargando mapa...</p>,
      ssr: false
    }
  ), []);


  const handleMapClick = (coords: Coords) => {
    
    // De momento, solo mostramos las coordenadas en la consola
    console.log("¡Clic en el mapa!", coords);
    
    // 1. Guardar estas 'coords' en un estado (useState)
    // 2. Usar ese estado para abrir un <Dialog> de shadcn/ui
    // 3. Pasar las 'coords' al Dialog para rellenar el formulario de "Crear POI"
  };

  return (
    // Pasamos la función 'handleMapClick' como prop a UrbanMap
    <UrbanMap onMapClick={handleMapClick} />
  );
}