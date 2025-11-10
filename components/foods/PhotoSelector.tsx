"use client";

import { useState } from "react";
import type { FoodType } from "@/types/foods";
import { getIconsByFoodType, isEmojiIcon } from "@/lib/constants/food-icons";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, Link as LinkIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { ImageCropper } from "@/components/shared/ImageCropper";

interface PhotoSelectorProps {
  foodType: FoodType;
  currentPhoto?: string | null;
  onPhotoChange: (photo: string) => void;
}

export function PhotoSelector({
  foodType,
  currentPhoto,
  onPhotoChange,
}: PhotoSelectorProps) {
  const [open, setOpen] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const icons = getIconsByFoodType(foodType);
  const isEmoji = isEmojiIcon(currentPhoto);

  const handleSelectIcon = (emoji: string) => {
    onPhotoChange(emoji);
    setOpen(false);
  };

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      onPhotoChange(urlInput.trim());
      setUrlInput("");
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div className="flex flex-col items-center gap-3">
        {/* Foto actual */}
        <div className="relative">
          <div className="w-24 h-24 rounded-lg bg-muted flex items-center justify-center text-5xl overflow-hidden border-2 border-border">
            {isEmoji || !currentPhoto ? (
              <span>{currentPhoto || "🍽️"}</span>
            ) : (
              <img
                src={currentPhoto}
                alt="Foto del alimento"
                className="w-full h-full object-cover"
              />
            )}
          </div>

          {/* Botón cambiar */}
          <DialogTrigger asChild>
            <Button
              type="button"
              size="icon"
              variant="secondary"
              className="absolute -bottom-2 -right-2 rounded-full h-8 w-8"
            >
              <Camera className="h-4 w-4" />
            </Button>
          </DialogTrigger>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Haz clic para cambiar la foto
        </p>
      </div>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Seleccionar Foto</DialogTitle>
          <DialogDescription>
            Elige un icono, sube una imagen o introduce una URL
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="icons" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="icons">Iconos</TabsTrigger>
            <TabsTrigger value="upload">Subir</TabsTrigger>
            <TabsTrigger value="url">URL</TabsTrigger>
          </TabsList>

          {/* Tab: Iconos predeterminados */}
          <TabsContent value="icons" className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-3">
                Iconos predeterminados
              </h4>
              <div className="grid grid-cols-3 gap-3 max-h-[300px] overflow-y-auto">
                {icons.map((icon) => (
                  <button
                    key={icon.id}
                    type="button"
                    onClick={() => handleSelectIcon(icon.emoji)}
                    className={cn(
                      "w-full aspect-square rounded-lg border-2 flex items-center justify-center text-4xl transition-all hover:bg-accent hover:scale-105",
                      currentPhoto === icon.emoji
                        ? "border-primary bg-accent"
                        : "border-border"
                    )}
                    title={icon.label}
                  >
                    {icon.emoji}
                  </button>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Tab: Subir imagen */}
          <TabsContent value="upload" className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-3">Subir imagen propia</h4>
              <ImageCropper
                onImageCropped={(base64) => {
                  onPhotoChange(base64);
                  setOpen(false);
                }}
                currentImage={currentPhoto}
                aspectRatio={1}
              />
              <p className="text-xs text-muted-foreground text-center mt-2">
                Recorta y comprime automáticamente tu imagen
              </p>
            </div>
          </TabsContent>

          {/* Tab: URL */}
          <TabsContent value="url" className="space-y-4">
            <div className="space-y-3">
              <div>
                <Label htmlFor="photo-url">URL de la imagen</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    id="photo-url"
                    type="url"
                    placeholder="https://ejemplo.com/imagen.jpg"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleUrlSubmit();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={handleUrlSubmit}
                    disabled={!urlInput.trim()}
                  >
                    <LinkIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Introduce la URL de una imagen del producto desde internet
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
