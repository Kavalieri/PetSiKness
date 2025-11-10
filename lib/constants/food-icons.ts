import type { FoodType } from "@/types/foods";

/**
 * Iconos predeterminados por tipo de alimento
 * Usando emojis grandes como iconos simples y efectivos
 */

export const FOOD_ICONS = {
  dry: [
    { id: "dry-1", emoji: "🍖", label: "Carne" },
    { id: "dry-2", emoji: "🥩", label: "Filete" },
    { id: "dry-3", emoji: "🦴", label: "Hueso" },
    { id: "dry-4", emoji: "🍗", label: "Muslo de pollo" },
    { id: "dry-5", emoji: "🥓", label: "Bacon" },
    { id: "dry-6", emoji: "🍱", label: "Caja de comida" },
  ],
  wet: [
    { id: "wet-1", emoji: "🥫", label: "Lata" },
    { id: "wet-2", emoji: "🍲", label: "Estofado" },
    { id: "wet-3", emoji: "🥘", label: "Paella" },
    { id: "wet-4", emoji: "🍜", label: "Cuenco de comida" },
    { id: "wet-5", emoji: "🥗", label: "Ensalada" },
    { id: "wet-6", emoji: "🍛", label: "Curry" },
  ],
  raw: [
    { id: "raw-1", emoji: "🥩", label: "Carne cruda" },
    { id: "raw-2", emoji: "🍖", label: "Chuleta" },
    { id: "raw-3", emoji: "🐟", label: "Pescado" },
    { id: "raw-4", emoji: "🐔", label: "Pollo" },
    { id: "raw-5", emoji: "🦴", label: "Hueso carnoso" },
    { id: "raw-6", emoji: "🥚", label: "Huevo" },
    { id: "raw-7", emoji: "🦐", label: "Camarón" },
    { id: "raw-8", emoji: "🦞", label: "Langosta" },
  ],
  homemade: [
    { id: "home-1", emoji: "👨‍🍳", label: "Chef" },
    { id: "home-2", emoji: "🍳", label: "Huevos" },
    { id: "home-3", emoji: "🥘", label: "Olla" },
    { id: "home-4", emoji: "🍲", label: "Cazuela" },
    { id: "home-5", emoji: "🥗", label: "Ensalada casera" },
    { id: "home-6", emoji: "❤️", label: "Hecho con amor" },
  ],
  treat: [
    { id: "treat-1", emoji: "🍪", label: "Galleta" },
    { id: "treat-2", emoji: "🦴", label: "Hueso premio" },
    { id: "treat-3", emoji: "🥓", label: "Tira de bacon" },
    { id: "treat-4", emoji: "🧀", label: "Queso" },
    { id: "treat-5", emoji: "🍬", label: "Caramelo" },
    { id: "treat-6", emoji: "🥖", label: "Pan" },
    { id: "treat-7", emoji: "🍖", label: "Snack de carne" },
    { id: "treat-8", emoji: "⭐", label: "Premio estrella" },
  ],
  supplement: [
    { id: "supp-1", emoji: "💊", label: "Pastilla" },
    { id: "supp-2", emoji: "💉", label: "Jeringa" },
    { id: "supp-3", emoji: "🧪", label: "Suplemento" },
    { id: "supp-4", emoji: "⚕️", label: "Médico" },
    { id: "supp-5", emoji: "🌿", label: "Hierba medicinal" },
    { id: "supp-6", emoji: "💚", label: "Salud" },
  ],
} as const;

/**
 * Obtener iconos disponibles para un tipo de alimento
 */
export function getIconsByFoodType(foodType: FoodType) {
  return FOOD_ICONS[foodType] || FOOD_ICONS.dry;
}

/**
 * Obtener icono por defecto según tipo de alimento
 */
export function getDefaultFoodIcon(foodType: FoodType): string {
  const icons = getIconsByFoodType(foodType);
  return icons[0]?.emoji || "🍽️";
}

/**
 * Verificar si un string es un emoji (icono predeterminado)
 */
export function isEmojiIcon(url: string | null | undefined): boolean {
  if (!url) return false;
  // Los emojis son cadenas cortas sin protocolo http/https y no son base64
  return (
    url.length <= 10 && !url.startsWith("http") && !url.startsWith("data:")
  );
}

/**
 * Obtener URL o emoji del icono
 */
export function getPhotoDisplay(
  photoUrl: string | null | undefined,
  foodType: FoodType
): string {
  if (!photoUrl) {
    return getDefaultFoodIcon(foodType);
  }
  return photoUrl;
}
