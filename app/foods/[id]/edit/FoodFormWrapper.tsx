'use client';

import { FoodForm } from '@/components/foods/FoodForm';
import { useRouter } from 'next/navigation';
import type { Foods } from '@/types/database.generated';

interface FoodFormWrapperProps {
  food: Foods;
}

export function FoodFormWrapper({ food }: FoodFormWrapperProps) {
  const router = useRouter();

  return (
    <FoodForm
      food={food}
      onSuccess={() => router.push(`/foods/${food.id}`)}
      onCancel={() => router.back()}
    />
  );
}
