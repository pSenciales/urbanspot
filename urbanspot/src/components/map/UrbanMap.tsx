"use client";

import { useState, useEffect } from "react";
import {
  Map,
  MapMarker,
  MapPopup,
  MapTileLayer,
  MapZoomControl,
} from "@/components/ui/map";
import { useMapEvents, useMap } from "react-leaflet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Search,
  Bus,
  Landmark,
  TreeDeciduous,
  Coffee,
  Camera,
  MapPin,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import CreatePOIDialog from "@/components/poi/CreatePOIDialog";
import { useSession } from "next-auth/react";
import Image from "next/image";

type UrbanMapProps = {
  onMapClick: (coords: { lat: number; lon: number }) => void;
};

type SearchResult = {
  lat: string;
  lon: string;
  display_name: string;
};

type POI = {
  _id: string;
  name: string;
  description: string;
  location: {
    lat: number;
    lng: number;
  };
  tags: string[];
  author: string;
  ratings: number;
  averageRating: number;
  images?: { url: string; metadata: Record<string, string> }[];
};

function MapClickHandler({
  onMapClick,
  marker,
  setMarker,
  onOpenCreateDialog,
  isAuthenticated
}: UrbanMapProps & {
  marker: { lat: number; lon: number } | null;
  setMarker: (marker: { lat: number; lon: number } | null) => void;
  onOpenCreateDialog: () => void;
  isAuthenticated: boolean;
}) {
  useMapEvents({
    click: (e) => {
      if (!isAuthenticated) return;
      const coords = { lat: e.latlng.lat, lon: e.latlng.lng };
      setMarker(coords);
      onMapClick(coords);
    },
  });

  return (
    <>
      {marker && (
        <MapMarker
          key={`${marker.lat}-${marker.lon}`}
          position={[marker.lat, marker.lon]}
          ref={(node) => {
            if (node) {
              setTimeout(() => {
                node.openPopup();
              }, 100);
            }
          }}
        >
          <MapPopup
            eventHandlers={{
              remove: () => setMarker(null)
            }}
          >
            <div className="p-2 min-w-[150px]">
              <Button
                size="sm"
                className="w-full"
                onClick={onOpenCreateDialog}
              >
                Crear POI aquí
              </Button>
            </div>
          </MapPopup>
        </MapMarker>
      )}
    </>
  );
}

function SearchControl({
  onLocationFound
}: {
  onLocationFound: (lat: number, lon: number, name: string) => void
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);

  // Debounce con useEffect
  useEffect(() => {
    if (!searchQuery.trim()) {
      setResults([]);
      setShowResults(false);
      setIsLoading(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5`
        );
        const data: SearchResult[] = await response.json();
        setResults(data);
        setShowResults(true);
      } catch (error) {
        console.error("Error en la búsqueda:", error);
      } finally {
        setIsLoading(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleSelectResult = (result: SearchResult) => {
    const { lat, lon, display_name } = result;
    onLocationFound(parseFloat(lat), parseFloat(lon), display_name);
    setSearchQuery("");
    setResults([]);
    setShowResults(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (results.length > 0) {
      handleSelectResult(results[0]);
    }
  };

  return (
    <div
      ref={(el) => {
        if (el && typeof window !== 'undefined') {
          import('leaflet').then((L) => {
            L.DomEvent.disableClickPropagation(el);
            L.DomEvent.disableScrollPropagation(el);
          });
        }
      }}
      className="absolute top-4 left-4 z-[1000] w-80"
    >
      <div className="bg-white rounded-lg shadow-lg p-2">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            type="text"
            placeholder="Buscar ubicación..."
            value={searchQuery}
            onChange={handleInputChange}
            className="flex-1"
            disabled={isLoading}
          />
          <Button
            type="submit"
            size="icon"
            disabled={isLoading}
          >
            <Search className="h-4 w-4" />
          </Button>
        </form>
      </div>

      {showResults && results.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg mt-2 max-h-60 overflow-y-auto">
          {results.map((result, index) => (
            <div
              key={index}
              className="p-3 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
              onClick={() => handleSelectResult(result)}
            >
              <p className="text-sm">{result.display_name}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MapSearchHandler({
  onLocationFound
}: {
  onLocationFound: (lat: number, lon: number) => void
}) {
  const map = useMap();

  const handleLocationFound = (lat: number, lon: number) => {
    map.setView([lat, lon], 16);
    onLocationFound(lat, lon);
  };

  return <SearchControl onLocationFound={handleLocationFound} />;
}

function POIPopupContent({ poi }: { poi: POI }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const images = poi.images || [];
  const hasImages = images.length > 0;
  const hasMultipleImages = images.length > 1;

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="p-2 max-w-xs min-w-[200px]">
      {hasImages && (
        <div className="relative mb-3 rounded-lg overflow-hidden">
          <div className="relative h-36 w-full bg-gray-100">
            <Image
              src={images[currentImageIndex].url}
              alt={`${poi.name} - Imagen ${currentImageIndex + 1}`}
              width={300}  
              height={200}
              className="w-full h-full object-cover"
            />

            {hasMultipleImages && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-1 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-1 rounded-full transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-1 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-1 rounded-full transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}

            {hasMultipleImages && (
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                {images.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentImageIndex(idx);
                    }}
                    className={`w-2 h-2 rounded-full transition-colors ${idx === currentImageIndex
                      ? "bg-white"
                      : "bg-white/50 hover:bg-white/75"
                      }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <h3 className="font-bold text-lg">{poi.name}</h3>
      <p className="text-sm text-gray-600 mb-2">{poi.description}</p>
      <div className="flex flex-wrap gap-1 mb-2">
        {poi.tags.map((tag, i) => (
          <span key={i} className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">
            {tag}
          </span>
        ))}
      </div>
      <div className="text-xs text-gray-500">
        <p>Autor: {poi.author}</p>
        <p>Valoración: {poi.averageRating} ({poi.ratings} votos)</p>
      </div>
    </div>
  );
}

export default function UrbanMap({ onMapClick }: UrbanMapProps) {
  const { data: session } = useSession();
  const [marker, setMarker] = useState<{ lat: number; lon: number } | null>(null);
  const [pois, setPois] = useState<POI[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const fetchPois = async () => {
    try {
      const res = await fetch("/api/pois");
      if (res.ok) {
        const data = await res.json();
        setPois(data);
      }
    } catch (error) {
      console.error("Error fetching POIs:", error);
    }
  };

  useEffect(() => {
    fetchPois();
  }, []);

  const handleLocationFound = (lat: number, lon: number) => {
    if (!session) return;
    const coords = { lat, lon };
    setMarker(coords);
    onMapClick(coords);
  };

  const getPoiIcon = (tags: string[]) => {
    const mainTag = tags[0]?.toLowerCase();
    const className = "size-6 text-gray-950";
    // Wrapper div with background color based on category
    const IconWrapper = ({ children, color }: { children: React.ReactNode, color: string }) => (
      <div className={`p-1.5 rounded-full shadow-xl ${color} border-2 border-gray-600`}>
        {children}
      </div>
    );

    switch (mainTag) {
      case "movilidad":
        return <IconWrapper color="bg-blue-500"><Bus className={className} /></IconWrapper>;
      case "cultura":
        return <IconWrapper color="bg-purple-500"><Landmark className={className} /></IconWrapper>;
      case "naturaleza":
        return <IconWrapper color="bg-green-500"><TreeDeciduous className={className} /></IconWrapper>;
      case "ocio":
        return <IconWrapper color="bg-orange-500"><Coffee className={className} /></IconWrapper>;
      case "turismo":
        return <IconWrapper color="bg-yellow-500"><Camera className={className} /></IconWrapper>;
      default:
        return <IconWrapper color="bg-gray-500"><MapPin className={className} /></IconWrapper>;
    }
  };

  return (
    <div className="w-full h-full">
      <Map center={[36.7202, -4.4214]} zoom={16}>
        <MapTileLayer />
        <MapZoomControl className="top-1 right-1 left-auto" />

        {/* Existing POIs */}
        {pois.map((poi) => {
          if (!poi.location || typeof poi.location.lat !== 'number' || typeof poi.location.lng !== 'number') {
            return null;
          }
          return (
            <MapMarker
              key={poi._id}
              position={[poi.location.lat, poi.location.lng]}
              icon={getPoiIcon(poi.tags)}
            >
              <MapPopup>
                <POIPopupContent poi={poi} />
              </MapPopup>
            </MapMarker>
          );
        })}

        <MapClickHandler
          onMapClick={onMapClick}
          marker={marker}
          setMarker={setMarker}
          onOpenCreateDialog={() => setIsDialogOpen(true)}
          isAuthenticated={!!session}
        />
        <MapSearchHandler onLocationFound={handleLocationFound} />
      </Map>

      <CreatePOIDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        location={marker}
        onPoiCreated={() => {
          fetchPois();
          setMarker(null);
        }}
      />
    </div>
  );
}