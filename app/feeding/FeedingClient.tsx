"use client";

import { FeedingList } from "@/components/feeding/FeedingList";
import { deleteFeeding } from "./actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Pet {
  id: string;
  name: string;
}

interface Food {
  id: string;
  name: string;
  brand: string | null;
}

// Mismo tipo que en actions.ts
interface FeedingWithRelations {
  id: string;
  household_id: string;
  pet_id: string;
  pet_name: string;
  food_id: string;
  food_name: string;
  food_brand: string | null;
  feeding_date: string;
  feeding_time: string | null;
  meal_number: number | null;
  amount_served_grams: number;
  amount_eaten_grams: number;
  amount_leftover_grams: number | null;
  appetite_rating: string | null;
  eating_speed: string | null;
  vomited: boolean | null;
  had_diarrhea: boolean | null;
  had_stool: boolean | null;
  stool_quality: string | null;
  notes: string | null;
  created_at: Date;
}

interface FeedingClientProps {
  feedings: FeedingWithRelations[];
  pets: Pet[];
  foods: Food[];
}

export function FeedingClient({ feedings, pets, foods }: FeedingClientProps) {
  const router = useRouter();

  const handleDelete = async (id: string) => {
    const result = await deleteFeeding(id);

    if (result.ok) {
      toast.success("Registro eliminado");
      router.refresh();
    } else {
      toast.error(result.message);
    }
  };

  return (
    <FeedingList 
      feedings={feedings} 
      pets={pets} 
      foods={foods} 
      onDelete={handleDelete} 
    />
  );
}
