"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { query } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { ok, fail } from "@/lib/result";
import type { Result } from "@/lib/result";

// ============================================
// SCHEMAS
// ============================================

const CreateHouseholdSchema = z.object({
  name: z
    .string()
    .min(1, "El nombre del hogar es requerido")
    .max(100, "El nombre es demasiado largo"),
});

const JoinHouseholdSchema = z.object({
  householdId: z.string().uuid("ID de hogar inválido"),
});

// ============================================
// TYPES
// ============================================

export interface Household {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
  member_count?: number;
  user_role?: "owner" | "member";
}

// ============================================
// ACTIONS
// ============================================

/**
 * Crear un nuevo hogar
 */
export async function createHousehold(
  formData: FormData
): Promise<Result<{ householdId: string }>> {
  const user = await getCurrentUser();
  if (!user?.profile_id) {
    return fail("Debes iniciar sesión para crear un hogar");
  }

  const parsed = CreateHouseholdSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return fail("Datos inválidos", parsed.error.flatten().fieldErrors);
  }

  const { name } = parsed.data;

  try {
    // Verificar si ya pertenece a un hogar
    const existingMembership = await query(
      `SELECT household_id FROM household_members WHERE profile_id = $1`,
      [user.profile_id]
    );

    if (existingMembership.rows.length > 0) {
      return fail("Ya perteneces a un hogar");
    }

    // Crear hogar
    const householdResult = await query(
      `INSERT INTO households (name, created_by)
       VALUES ($1, $2)
       RETURNING id`,
      [name, user.profile_id]
    );

    const householdId = householdResult.rows[0].id;

    // Añadir creador como owner
    await query(
      `INSERT INTO household_members (household_id, profile_id, role)
       VALUES ($1, $2, 'owner')`,
      [householdId, user.profile_id]
    );

    revalidatePath("/");
    revalidatePath("/onboarding");

    return ok({ householdId });
  } catch (error) {
    console.error("Error al crear hogar:", error);
    return fail("Error al crear el hogar");
  }
}

/**
 * Unirse a un hogar existente
 */
export async function joinHousehold(
  formData: FormData
): Promise<Result<{ householdId: string }>> {
  const user = await getCurrentUser();
  if (!user?.profile_id) {
    return fail("Debes iniciar sesión para unirte a un hogar");
  }

  const parsed = JoinHouseholdSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return fail("Datos inválidos", parsed.error.flatten().fieldErrors);
  }

  const { householdId } = parsed.data;

  try {
    // Verificar si ya pertenece a un hogar
    const existingMembership = await query(
      `SELECT household_id FROM household_members WHERE profile_id = $1`,
      [user.profile_id]
    );

    if (existingMembership.rows.length > 0) {
      return fail("Ya perteneces a un hogar");
    }

    // Verificar que el hogar existe
    const householdExists = await query(
      `SELECT id FROM households WHERE id = $1`,
      [householdId]
    );

    if (householdExists.rows.length === 0) {
      return fail("El hogar no existe");
    }

    // Unirse al hogar como member
    await query(
      `INSERT INTO household_members (household_id, profile_id, role)
       VALUES ($1, $2, 'member')`,
      [householdId, user.profile_id]
    );

    revalidatePath("/");
    revalidatePath("/onboarding");

    return ok({ householdId });
  } catch (error) {
    console.error("Error al unirse al hogar:", error);
    return fail("Error al unirse al hogar");
  }
}

/**
 * Obtener información del hogar del usuario actual
 */
export async function getCurrentHousehold(): Promise<Result<Household | null>> {
  const user = await getCurrentUser();
  if (!user?.profile_id) {
    return fail("Debes iniciar sesión");
  }

  try {
    const result = await query(
      `SELECT 
         h.id,
         h.name,
         h.created_by,
         h.created_at,
         hm.role as user_role,
         (SELECT COUNT(*) FROM household_members WHERE household_id = h.id) as member_count
       FROM households h
       INNER JOIN household_members hm ON h.id = hm.household_id
       WHERE hm.profile_id = $1
       LIMIT 1`,
      [user.profile_id]
    );

    if (result.rows.length === 0) {
      return ok(null);
    }

    return ok(result.rows[0]);
  } catch (error) {
    console.error("Error al obtener hogar:", error);
    return fail("Error al obtener información del hogar");
  }
}

/**
 * Listar todos los hogares (para búsqueda al unirse)
 */
export async function searchHouseholds(
  searchTerm: string = ""
): Promise<Result<Household[]>> {
  try {
    const result = await query(
      `SELECT 
         h.id,
         h.name,
         h.created_at,
         (SELECT COUNT(*) FROM household_members WHERE household_id = h.id) as member_count
       FROM households h
       WHERE h.name ILIKE $1
       ORDER BY h.created_at DESC
       LIMIT 20`,
      [`%${searchTerm}%`]
    );

    return ok(result.rows);
  } catch (error) {
    console.error("Error al buscar hogares:", error);
    return fail("Error al buscar hogares");
  }
}
