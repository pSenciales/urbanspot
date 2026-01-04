"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import Image from "next/image";
import RatingWidget from "@/components/rating/RatingWidget";

type GalleryImage = {
  _id?: string;
  url: string;
  metadata: Record<string, string>;
  author?: string;
  ratings?: number;
  averageRating?: number;
  poiName?: string;
  poiId?: string;
};

type POIGalleryDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  images: GalleryImage[];
  poiName: string;
  poiAuthorId: string;
  initialIndex?: number;
};

export default function POIGalleryDialog({
  isOpen,
  onClose,
  images,
  poiName,
  poiAuthorId,
  initialIndex = 0,
}: POIGalleryDialogProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") nextImage();
    if (e.key === "ArrowLeft") prevImage();
    if (e.key === "Escape") onClose();
  };

  if (images.length === 0) {
    return null;
  }

  const currentImage = images[currentIndex];
  const imageAuthorId = currentImage.author || poiAuthorId;
  const currentPoiName = currentImage.poiName || poiName;
  const currentPoiId = currentImage.poiId;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-w-5xl h-[60%] p-0 flex flex-col overflow-hidden z-1000"
        onKeyDown={handleKeyDown}
        showCloseButton={false}
      >
        <DialogHeader className="p-4 pb-0 flex-shrink-0">
          <DialogTitle>{currentPoiName}</DialogTitle>
        </DialogHeader>

        <div className="relative flex-1 flex items-center justify-center bg-black/5 dark:bg-black/20 min-h-0 overflow-hidden">
          {/* Main Image */}
          <div className="relative w-full h-full">
            <Image
              src={currentImage.url}
              alt={`${currentPoiName} - Imagen ${currentIndex + 1}`}
              fill
              className="object-contain h-full"
              sizes="(max-width: 1200px) 100vw, 1200px"
            />
          </div>

          {/* Navigation Buttons */}
          {images.length > 1 && (
            <>
              <Button
                onClick={prevImage}
                variant="secondary"
                size="icon"
                className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/50 hover:bg-black/70 text-white border-0"
              >
                <ChevronLeft className="w-6 h-6" />
              </Button>
              <Button
                onClick={nextImage}
                variant="secondary"
                size="icon"
                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/50 hover:bg-black/70 text-white border-0"
              >
                <ChevronRight className="w-6 h-6" />
              </Button>
            </>
          )}

          {/* Close Button */}
          <Button
            onClick={onClose}
            variant="secondary"
            size="icon"
            className="absolute top-4 right-4 rounded-full bg-black/50 hover:bg-black/70 text-white border-0"
          >
            <X className="w-5 h-5" />
          </Button>

          {/* Image Counter */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
            {currentIndex + 1} / {images.length}
          </div>
        </div>

        {/* Image Rating */}
        {currentImage._id && (
          <div className="px-4 py-2 border-t border-gray-200 flex-shrink-0 bg-white">
            <RatingWidget
              key={currentImage._id}
              targetType="Image"
              targetId={currentImage._id}
              poiId={currentPoiId}
              currentRating={currentImage.averageRating || 0}
              totalVotes={currentImage.ratings || 0}
              authorId={imageAuthorId}
            />
          </div>
        )}

        {/* Thumbnail Strip */}
        {images.length > 1 && (
          <div className="p-4 overflow-x-auto flex-shrink-0">
            <div className="flex gap-2 justify-center">
              {images.map((image, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${idx === currentIndex
                    ? "border-blue-500 scale-105"
                    : "border-gray-300 dark:border-gray-600 opacity-60 hover:opacity-100"
                    }`}
                >
                  <Image
                    src={image.url}
                    alt={`Thumbnail ${idx + 1}`}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                </button>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
