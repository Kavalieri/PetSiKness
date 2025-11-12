"use client";

import { useState, useCallback, useRef } from "react";
import Cropper, { Area } from "react-easy-crop";
import imageCompression from "browser-image-compression";
import { Upload, RotateCw, ZoomIn, ZoomOut, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";

interface ImageCropperProps {
  onImageCropped: (base64Image: string) => void;
  currentImage?: string | null;
  aspectRatio?: number;
}

/**
 * Crear canvas con imagen recortada
 */
async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area
): Promise<string> {
  const image = new Image();
  image.src = imageSrc;

  await new Promise((resolve) => {
    image.onload = resolve;
  });

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("No 2d context");
  }

  // Set canvas size to match the crop area
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  // Draw the cropped image
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  // Convert canvas to base64
  return canvas.toDataURL("image/jpeg", 0.95);
}

/**
 * Componente para subir y recortar imágenes
 */
export function ImageCropper({
  onImageCropped,
  currentImage, // eslint-disable-line @typescript-eslint/no-unused-vars
  aspectRatio = 1, // 1:1 por defecto (cuadrado)
}: ImageCropperProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  /**
   * Manejar selección de archivo
   */
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Archivo inválido",
        description: "Por favor selecciona una imagen",
        variant: "destructive",
      });
      return;
    }

    // Validar tamaño (máx 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Archivo muy grande",
        description: "La imagen no puede superar 10MB",
        variant: "destructive",
      });
      return;
    }

    try {
      // Leer archivo
      const reader = new FileReader();
      reader.onload = () => {
        setImageSrc(reader.result as string);
        setOpen(true);
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        setRotation(0);
      };
      reader.readAsDataURL(file);
    } catch {
      toast({
        title: "Error",
        description: "No se pudo cargar la imagen",
        variant: "destructive",
      });
    }

    // Limpiar input para permitir seleccionar el mismo archivo de nuevo
    e.target.value = "";
  };

  /**
   * Callback cuando el crop cambia
   */
  const onCropComplete = useCallback(
    (croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  /**
   * Procesar y comprimir imagen recortada
   */
  const handleCropConfirm = async () => {
    if (!imageSrc || !croppedAreaPixels) return;

    setIsProcessing(true);

    try {
      // 1. Obtener imagen recortada
      const croppedBase64 = await getCroppedImg(imageSrc, croppedAreaPixels);

      // 2. Convertir base64 a blob
      const response = await fetch(croppedBase64);
      const blob = await response.blob();

      // 3. Comprimir imagen
      const compressedBlob = await imageCompression(blob as File, {
        maxSizeMB: 0.5, // Máximo 500KB
        maxWidthOrHeight: 512, // Max 512px (suficiente para avatar)
        useWebWorker: true,
        fileType: "image/jpeg",
      });

      // 4. Convertir blob comprimido a base64
      const reader = new FileReader();
      reader.onload = () => {
        const finalBase64 = reader.result as string;
        onImageCropped(finalBase64);
        setOpen(false);
        setImageSrc(null);

        toast({
          title: "Imagen guardada",
          description: "Avatar actualizado correctamente",
        });
      };
      reader.readAsDataURL(compressedBlob);
    } catch (error) {
      console.error("Error procesando imagen:", error);
      toast({
        title: "Error",
        description: "No se pudo procesar la imagen",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Cancelar crop
   */
  const handleCancel = () => {
    setOpen(false);
    setImageSrc(null);
  };

  /**
   * Trigger file input
   */
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      {/* Input oculto */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Botón subir */}
      <Button
        type="button"
        variant="outline"
        onClick={handleUploadClick}
        className="w-full"
      >
        <Upload className="h-4 w-4 mr-2" />
        Subir foto personalizada
      </Button>

      {/* Dialog con cropper */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Recortar imagen</DialogTitle>
            <DialogDescription>
              Ajusta el zoom y posición para recortar tu imagen
            </DialogDescription>
          </DialogHeader>

          {/* Cropper */}
          {imageSrc && (
            <div className="space-y-4">
              {/* Área de crop */}
              <div className="relative w-full h-96 bg-muted rounded-lg overflow-hidden">
                <Cropper
                  image={imageSrc}
                  crop={crop}
                  zoom={zoom}
                  rotation={rotation}
                  aspect={aspectRatio}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onRotationChange={setRotation}
                  onCropComplete={onCropComplete}
                />
              </div>

              {/* Controles de zoom */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <ZoomOut className="h-4 w-4" />
                  <Slider
                    value={[zoom]}
                    onValueChange={(value: number[]) => setZoom(value[0])}
                    min={1}
                    max={3}
                    step={0.1}
                    className="flex-1"
                  />
                  <ZoomIn className="h-4 w-4" />
                </div>

                {/* Control de rotación */}
                <div className="flex items-center gap-3">
                  <RotateCw className="h-4 w-4" />
                  <Slider
                    value={[rotation]}
                    onValueChange={(value: number[]) => setRotation(value[0])}
                    min={0}
                    max={360}
                    step={1}
                    className="flex-1"
                  />
                  <span className="text-sm text-muted-foreground w-12 text-right">
                    {rotation}°
                  </span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isProcessing}
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleCropConfirm}
              disabled={isProcessing}
            >
              <Check className="h-4 w-4 mr-2" />
              {isProcessing ? "Procesando..." : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
