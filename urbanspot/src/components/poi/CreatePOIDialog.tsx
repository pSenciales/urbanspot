"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type CreatePOIDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  location: { lat: number; lon: number } | null;
  onPoiCreated: () => void;
};

export default function CreatePOIDialog({
  isOpen,
  onClose,
  location,
  onPoiCreated,
}: CreatePOIDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    imageUrl: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!location) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/pois", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          tags: [formData.category],
          location: {
            lat: location.lat,
            lng: location.lon,
          },
          //======================PARA MYSQL TENDRIA QUE TENER O EL CORREO DE AUTHOR O EL ID, NO ME VALE EL NOMBRE PORQUE NO ES UNICO
          author: 1, // Mocked for now
          images: formData.imageUrl? [{ url: formData.imageUrl, metadata: {} }] : [], // Deberia de tener mínimo una imagen 
        }),
      });

      if (response.ok) {
        onPoiCreated();
        onClose();
        setFormData({ name: "", description: "", category: "", imageUrl: "" });
      } else {
        console.error("Error creating POI");
      }
    } catch (error) {
      console.error("Error creating POI:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Crear nuevo punto de interés</DialogTitle>
          <DialogDescription>
            Añade los detalles del nuevo lugar. Haz clic en guardar cuando termines.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Nombre
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Descripción
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">
                Categoría
              </Label>
              <Select
                value={formData.category}
                onValueChange={(value) =>
                  setFormData({ ...formData, category: value })
                }
                required
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="movilidad">Movilidad</SelectItem>
                  <SelectItem value="cultura">Cultura</SelectItem>
                  <SelectItem value="naturaleza">Naturaleza</SelectItem>
                  <SelectItem value="ocio">Ocio</SelectItem>
                  <SelectItem value="turismo">Turismo</SelectItem>
                  <SelectItem value="otros">Otros</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="image" className="text-right">
                Imagen URL
              </Label>
              <Input
                id="image"
                type="url"
                placeholder="https://..."
                value={formData.imageUrl}
                onChange={(e) =>
                  setFormData({ ...formData, imageUrl: e.target.value })
                }
                className="col-span-3"
              />
            </div>
            {location && (
              <div className="text-xs text-gray-500 text-center">
                Ubicación: {location.lat.toFixed(6)}, {location.lon.toFixed(6)}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Guardando..." : "Guardar POI"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
