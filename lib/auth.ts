import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { query } from './db';

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  return session?.user ?? null;
}

export async function getUserHouseholdId(): Promise<string | null> {
  const user = await getCurrentUser();
  if (!user?.profile_id) return null;

  const result = await query(
    `SELECT household_id FROM household_members WHERE profile_id = $1 LIMIT 1`,
    [user.profile_id],
  );

  return result.rows[0]?.household_id ?? null;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('No autenticado');
  }
  return user;
}

export async function requireHousehold() {
  const householdId = await getUserHouseholdId();
  if (!householdId) {
    throw new Error('No perteneces a ningún hogar');
  }
  return householdId;
}
