"use client";

import { useEffect, useRef } from "react";
import "ol/ol.css";
import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import { fromLonLat, toLonLat } from "ol/proj";
import { ScaleLine, defaults as defaultControls } from "ol/control";
import { type MapBrowserEvent } from "ol";

const plConstitutionCoords = [-4.4214, 36.7202]; //Coordenadas de Málaga, el mapa sale centrado en Málaga
const mapCenter = fromLonLat(plConstitutionCoords);

type UrbanMapProps = {
  onMapClick: (coords: { lat: number; lon: number }) => void;
};

export default function UrbanMap({ onMapClick }: UrbanMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    const map = new Map({
      target: mapRef.current,
      layers: [
        // --- 3. USA EL 'source: new OSM()' ---
        new TileLayer({
          source: new OSM(), // Esto usa el mapa gratuito de OpenStreetMap
        }),
      ],
      view: new View({
        center: mapCenter,
        zoom: 16,
      }),
      controls: defaultControls().extend([
        new ScaleLine({
          units: "metric",
        }),
      ]),
    });

    const handleClick = (evt: any) => {
      const lonLat = toLonLat(evt.coordinate);
      onMapClick({ lon: lonLat[0], lat: lonLat[1] });
    };

    map.on("click", handleClick);

    return () => {
      map.un("click", handleClick);
      map.setTarget(undefined);
    };
  }, [onMapClick]);

  return <div ref={mapRef} className="w-full h-full" />;
}