"use client";

import { useState } from "react";
import { type Species } from "@/types/pets";
import { getAvatarsBySpecies, isEmojiAvatar } from "@/lib/constants/avatars";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Camera } from "lucide-react";
import { cn } from "@/lib/utils";
import { ImageCropper } from "@/components/shared/ImageCropper";

interface AvatarSelectorProps {
  species: Species;
  currentAvatar?: string | null;
  onAvatarChange: (avatar: string) => void;
}

export function AvatarSelector({
  species,
  currentAvatar,
  onAvatarChange,
}: AvatarSelectorProps) {
  const [open, setOpen] = useState(false);
  const avatars = getAvatarsBySpecies(species);
  const isEmoji = isEmojiAvatar(currentAvatar);

  const handleSelect = (emoji: string) => {
    onAvatarChange(emoji);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div className="flex flex-col items-center gap-3">
        {/* Avatar actual */}
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center text-5xl overflow-hidden border-2 border-border">
            {isEmoji || !currentAvatar ? (
              <span>{currentAvatar || "🐾"}</span>
            ) : (
              <img
                src={currentAvatar}
                alt="Avatar"
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
          Haz clic para cambiar el avatar
        </p>
      </div>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Seleccionar Avatar</DialogTitle>
          <DialogDescription>Elige un avatar para tu mascota</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Grid de avatares predeterminados */}
          <div>
            <h4 className="text-sm font-medium mb-3">
              Avatares predeterminados
            </h4>
            <div className="grid grid-cols-3 gap-3">
              {avatars.map((avatar) => (
                <button
                  key={avatar.id}
                  type="button"
                  onClick={() => handleSelect(avatar.emoji)}
                  className={cn(
                    "w-full aspect-square rounded-lg border-2 flex items-center justify-center text-4xl transition-all hover:bg-accent hover:scale-105",
                    currentAvatar === avatar.emoji
                      ? "border-primary bg-accent"
                      : "border-border"
                  )}
                  title={avatar.label}
                >
                  {avatar.emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Opción de subir imagen */}
          <div className="border-t pt-4">
            <ImageCropper
              onImageCropped={(base64) => {
                onAvatarChange(base64);
                setOpen(false);
              }}
              currentImage={currentAvatar}
              aspectRatio={1}
            />
            <p className="text-xs text-muted-foreground text-center mt-2">
              Recorta y comprime automáticamente tu imagen
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
