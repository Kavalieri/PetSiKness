"use client";

/**
 * FoodImage - Client Component para manejar la carga de imágenes
 *
 * Componente que maneja el estado de error de las imágenes.
 * Necesario porque los event handlers (onError) solo funcionan en Client Components.
 */

interface FoodImageProps {
  src: string;
  alt: string;
  className?: string;
}

export function FoodImage({ src, alt, className = "" }: FoodImageProps) {
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={(e) => {
        (e.target as HTMLImageElement).style.display = "none";
        const parent = (e.target as HTMLImageElement).parentElement;
        if (parent) {
          parent.innerHTML = `
            <div class="flex items-center justify-center h-48 bg-muted rounded-lg">
              <p class="text-muted-foreground">Error al cargar la imagen</p>
            </div>
          `;
        }
      }}
    />
  );
}
