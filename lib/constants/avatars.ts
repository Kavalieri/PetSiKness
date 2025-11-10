import { SPECIES, type Species } from "@/types/pets";

/**
 * Avatares predeterminados por especie
 * Usando emojis grandes como avatares simples y efectivos
 */

export const PET_AVATARS = {
  [SPECIES.CAT]: [
    { id: "cat-1", emoji: "🐱", label: "Gato naranja" },
    { id: "cat-2", emoji: "🐈", label: "Gato negro" },
    { id: "cat-3", emoji: "🐈‍⬛", label: "Gato negro sólido" },
    { id: "cat-4", emoji: "😸", label: "Gato sonriente" },
    { id: "cat-5", emoji: "😺", label: "Gato feliz" },
    { id: "cat-6", emoji: "😻", label: "Gato enamorado" },
    { id: "cat-7", emoji: "😹", label: "Gato riendo" },
    { id: "cat-8", emoji: "😼", label: "Gato guiñando" },
    { id: "cat-9", emoji: "🐾", label: "Patitas de gato" },
  ],
  [SPECIES.DOG]: [
    { id: "dog-1", emoji: "🐶", label: "Perro" },
    { id: "dog-2", emoji: "🐕", label: "Perro de lado" },
    { id: "dog-3", emoji: "🦮", label: "Perro guía" },
    { id: "dog-4", emoji: "🐕‍🦺", label: "Perro de servicio" },
    { id: "dog-5", emoji: "🐩", label: "Caniche" },
    { id: "dog-6", emoji: "🐾", label: "Patitas de perro" },
    { id: "dog-7", emoji: "🦴", label: "Hueso" },
    { id: "dog-8", emoji: "🦴", label: "Hueso 2" },
    { id: "dog-9", emoji: "🌭", label: "Hot dog" },
  ],
  [SPECIES.BIRD]: [
    { id: "bird-1", emoji: "🐦", label: "Pájaro" },
    { id: "bird-2", emoji: "🦜", label: "Loro" },
    { id: "bird-3", emoji: "🦅", label: "Águila" },
    { id: "bird-4", emoji: "🦆", label: "Pato" },
    { id: "bird-5", emoji: "🐧", label: "Pingüino" },
    { id: "bird-6", emoji: "🦉", label: "Búho" },
    { id: "bird-7", emoji: "🐤", label: "Pollito" },
    { id: "bird-8", emoji: "🦚", label: "Pavo real" },
    { id: "bird-9", emoji: "🪶", label: "Pluma" },
  ],
  [SPECIES.RABBIT]: [
    { id: "rabbit-1", emoji: "🐰", label: "Conejo" },
    { id: "rabbit-2", emoji: "🐇", label: "Conejo saltando" },
    { id: "rabbit-3", emoji: "🐾", label: "Patitas de conejo" },
    { id: "rabbit-4", emoji: "🥕", label: "Zanahoria" },
  ],
  [SPECIES.HAMSTER]: [
    { id: "hamster-1", emoji: "🐹", label: "Hámster" },
    { id: "hamster-2", emoji: "🐾", label: "Patitas" },
    { id: "hamster-3", emoji: "🌰", label: "Bellota" },
  ],
  [SPECIES.GUINEA_PIG]: [
    { id: "guinea-1", emoji: "🐹", label: "Cobaya" },
    { id: "guinea-2", emoji: "🐾", label: "Patitas" },
    { id: "guinea-3", emoji: "🥬", label: "Lechuga" },
  ],
  [SPECIES.FERRET]: [
    { id: "ferret-1", emoji: "🦡", label: "Hurón" },
    { id: "ferret-2", emoji: "🐾", label: "Patitas" },
  ],
  [SPECIES.OTHER]: [
    { id: "other-1", emoji: "🐾", label: "Huellas" },
    { id: "other-2", emoji: "❤️", label: "Corazón" },
    { id: "other-3", emoji: "⭐", label: "Estrella" },
    { id: "other-4", emoji: "💚", label: "Corazón verde" },
    { id: "other-5", emoji: "🌟", label: "Estrella brillante" },
    { id: "other-6", emoji: "✨", label: "Destellos" },
  ],
} as const;

/**
 * Obtener avatares disponibles para una especie
 */
export function getAvatarsBySpecies(species: Species) {
  return PET_AVATARS[species] || PET_AVATARS[SPECIES.OTHER];
}

/**
 * Obtener avatar por defecto según especie
 */
export function getDefaultAvatar(species: Species): string {
  const avatars = getAvatarsBySpecies(species);
  return avatars[0]?.emoji || "🐾";
}

/**
 * Verificar si un string es un emoji (avatar predeterminado)
 */
export function isEmojiAvatar(url: string | null | undefined): boolean {
  if (!url) return false;
  // Los emojis son cadenas cortas sin protocolo http/https
  return url.length <= 10 && !url.startsWith("http");
}

/**
 * Obtener URL o emoji del avatar
 */
export function getAvatarDisplay(
  photoUrl: string | null | undefined,
  species: Species
): { type: "emoji" | "url"; value: string } {
  if (!photoUrl) {
    return { type: "emoji", value: getDefaultAvatar(species) };
  }

  if (isEmojiAvatar(photoUrl)) {
    return { type: "emoji", value: photoUrl };
  }

  return { type: "url", value: photoUrl };
}
