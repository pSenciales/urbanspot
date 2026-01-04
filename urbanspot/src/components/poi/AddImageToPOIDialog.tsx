"use client";

import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, X, ImageIcon } from "lucide-react";

type AddImageToPOIDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  poiId: string;
  poiName: string;
  onImageAdded: () => void;
};

export default function AddImageToPOIDialog({
  isOpen,
  onClose,
  poiId,
  poiName,
  onImageAdded,
}: AddImageToPOIDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (file: File | null) => {
    if (file) {
      if (!file.type.startsWith("image/")) {
        alert("Solo se permiten archivos de imagen");
        return;
      }
      if (file.size > 4.5 * 1024 * 1024) {
        alert("El archivo es demasiado grande. Máximo 4.5MB");
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setImageFile(null);
      setImagePreview(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    handleImageChange(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageFile) return;

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("image", imageFile);

      const response = await fetch(`/api/pois/${poiId}/images`, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        onImageAdded();
        handleClose();
      } else {
        const error = await response.json();
        alert(error.error || "Error al añadir la imagen");
      }
    } catch (error) {
      console.error("Error adding image:", error);
      alert("Error al añadir la imagen");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Añadir imagen a {poiName}</DialogTitle>
          <DialogDescription>
            Sube una nueva imagen para este punto de interés.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="py-4">
            {imagePreview ? (
              <div className="relative group">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-64 object-cover rounded-lg border-2 border-gray-200 dark:border-gray-700"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => handleImageChange(null)}
                    className="flex items-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Eliminar
                  </Button>
                </div>
                <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                  {imageFile?.name}
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`
                  relative cursor-pointer
                  w-full h-64 
                  border-2 border-dashed rounded-lg
                  flex flex-col items-center justify-center gap-3
                  transition-all duration-200 ease-in-out
                  ${
                    isDragging
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
                      : "border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  }
                `}
              >
                <div
                  className={`
                  p-3 rounded-full
                  ${
                    isDragging
                      ? "bg-blue-100 dark:bg-blue-900"
                      : "bg-gray-100 dark:bg-gray-800"
                  }
                `}
                >
                  {isDragging ? (
                    <Upload className="w-8 h-8 text-blue-500" />
                  ) : (
                    <ImageIcon className="w-8 h-8 text-gray-400" />
                  )}
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {isDragging
                      ? "Suelta la imagen aquí"
                      : "Arrastra una imagen o haz clic"}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    PNG, JPG, WEBP o GIF (máx. 4.5MB)
                  </p>
                </div>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={(e) => handleImageChange(e.target.files?.[0] || null)}
              className="hidden"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || !imageFile}>
              {isLoading ? "Subiendo..." : "Añadir imagen"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}