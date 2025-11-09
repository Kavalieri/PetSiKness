import {
  SPECIES,
  GENDER,
  BODY_CONDITION,
  APPETITE,
  ACTIVITY_LEVEL,
  type Species,
} from '@/types/pets';

// ============================================
// LABELS Y TRADUCCIONES
// ============================================

/**
 * Labels en español para especies
 */
export const SPECIES_LABELS: Record<Species, string> = {
  cat: 'Gato',
  dog: 'Perro',
  bird: 'Ave',
  rabbit: 'Conejo',
  hamster: 'Hámster',
  guinea_pig: 'Cobaya',
  ferret: 'Hurón',
  other: 'Otro',
};

/**
 * Opciones para select de especies
 */
export const SPECIES_OPTIONS = Object.entries(SPECIES_LABELS).map(([value, label]) => ({
  value,
  label,
}));

/**
 * Labels para género
 */
export const GENDER_LABELS = {
  [GENDER.MALE]: 'Macho',
  [GENDER.FEMALE]: 'Hembra',
  [GENDER.UNKNOWN]: 'Desconocido',
} as const;

/**
 * Opciones para select de género
 */
export const GENDER_OPTIONS = Object.entries(GENDER_LABELS).map(([value, label]) => ({
  value,
  label,
}));

/**
 * Labels para condición corporal
 */
export const BODY_CONDITION_LABELS = {
  [BODY_CONDITION.UNDERWEIGHT]: 'Bajo peso',
  [BODY_CONDITION.IDEAL]: 'Peso ideal',
  [BODY_CONDITION.OVERWEIGHT]: 'Sobrepeso',
  [BODY_CONDITION.OBESE]: 'Obesidad',
} as const;

/**
 * Opciones para select de condición corporal
 */
export const BODY_CONDITION_OPTIONS = Object.entries(BODY_CONDITION_LABELS).map(([value, label]) => ({
  value,
  label,
}));

/**
 * Emojis para condición corporal (para badges visuales)
 */
export const BODY_CONDITION_EMOJIS = {
  [BODY_CONDITION.UNDERWEIGHT]: '⚠️',
  [BODY_CONDITION.IDEAL]: '✅',
  [BODY_CONDITION.OVERWEIGHT]: '⚠️',
  [BODY_CONDITION.OBESE]: '🔴',
} as const;

/**
 * Labels para nivel de apetito
 */
export const APPETITE_LABELS = {
  [APPETITE.POOR]: 'Malo',
  [APPETITE.NORMAL]: 'Normal',
  [APPETITE.GOOD]: 'Bueno',
  [APPETITE.EXCELLENT]: 'Excelente',
} as const;

/**
 * Opciones para select de apetito
 */
export const APPETITE_OPTIONS = Object.entries(APPETITE_LABELS).map(([value, label]) => ({
  value,
  label,
}));

/**
 * Labels para nivel de actividad
 */
export const ACTIVITY_LEVEL_LABELS = {
  [ACTIVITY_LEVEL.SEDENTARY]: 'Sedentario',
  [ACTIVITY_LEVEL.LOW]: 'Bajo',
  [ACTIVITY_LEVEL.MODERATE]: 'Moderado',
  [ACTIVITY_LEVEL.HIGH]: 'Alto',
  [ACTIVITY_LEVEL.VERY_HIGH]: 'Muy alto',
} as const;

/**
 * Opciones para select de nivel de actividad
 */
export const ACTIVITY_LEVEL_OPTIONS = Object.entries(ACTIVITY_LEVEL_LABELS).map(([value, label]) => ({
  value,
  label,
}));

// ============================================
// RAZAS POR ESPECIE
// ============================================

/**
 * Razas comunes de gatos
 */
export const CAT_BREEDS = [
  'Persa',
  'Siamés',
  'Maine Coon',
  'Bengalí',
  'Británico de pelo corto',
  'Ragdoll',
  'Sphynx',
  'Angora',
  'Común Europeo',
  'Mestizo',
  'Otro',
] as const;

/**
 * Razas comunes de perros
 */
export const DOG_BREEDS = [
  'Labrador',
  'Golden Retriever',
  'Pastor Alemán',
  'Bulldog',
  'Beagle',
  'Poodle',
  'Chihuahua',
  'Yorkshire',
  'Boxer',
  'Husky Siberiano',
  'Dachshund',
  'Shih Tzu',
  'Rottweiler',
  'Mestizo',
  'Otro',
] as const;

/**
 * Tipos comunes de aves
 */
export const BIRD_TYPES = [
  'Periquito',
  'Canario',
  'Loro',
  'Cacatúa',
  'Agapornis',
  'Diamante mandarín',
  'Otro',
] as const;

/**
 * Razas de conejos
 */
export const RABBIT_BREEDS = [
  'Enano',
  'Belier',
  'Gigante',
  'Angora',
  'Rex',
  'Holandés',
  'Mestizo',
  'Otro',
] as const;

/**
 * Obtener lista de razas según la especie
 */
export function getBreedsBySpecies(species: Species): readonly string[] {
  switch (species) {
    case SPECIES.CAT:
      return CAT_BREEDS;
    case SPECIES.DOG:
      return DOG_BREEDS;
    case SPECIES.BIRD:
      return BIRD_TYPES;
    case SPECIES.RABBIT:
      return RABBIT_BREEDS;
    default:
      return ['Otro'];
  }
}

// ============================================
// EMOJIS POR ESPECIE
// ============================================

/**
 * Emoji representativo de cada especie
 */
export const SPECIES_EMOJIS: Record<Species, string> = {
  cat: '🐱',
  dog: '🐶',
  bird: '🐦',
  rabbit: '🐰',
  hamster: '🐹',
  guinea_pig: '🐹',
  ferret: '🦡',
  other: '🐾',
};

// ============================================
// UTILIDADES
// ============================================

/**
 * Calcular edad a partir de fecha de nacimiento
 */
export function calculateAge(birthDate: string | null | undefined): string | null {
  if (!birthDate) return null;

  const birth = new Date(birthDate);
  const today = new Date();

  const years = today.getFullYear() - birth.getFullYear();
  const months = today.getMonth() - birth.getMonth();

  if (years === 0) {
    return months <= 1 ? `${months} mes` : `${months} meses`;
  }

  if (months < 0) {
    return `${years - 1} años, ${12 + months} meses`;
  }

  return years === 1 ? `1 año` : `${years} años`;
}

/**
 * Formatear peso con unidad
 */
export function formatWeight(weightKg: number | null | undefined): string {
  if (weightKg == null) return '-';
  return `${weightKg.toFixed(2)} kg`;
}

/**
 * Formatear meta diaria de alimento
 */
export function formatDailyGoal(grams: number): string {
  if (grams >= 1000) {
    return `${(grams / 1000).toFixed(2)} kg`;
  }
  return `${grams} g`;
}
