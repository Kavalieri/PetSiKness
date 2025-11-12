"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { UtensilsCrossed } from "lucide-react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { MealGroupCard } from "./MealGroupCard";

// ============================================
// TIPOS
// ============================================

interface Pet {
  id: string;
  name: string;
}

interface Food {
  id: string;
  name: string;
  brand: string | null;
}

interface FeedingData {
  id: string;
  household_id?: string;
  pet_id: string;
  pet_name: string;
  food_id: string;
  food_name: string;
  food_brand: string | null;
  feeding_date: string;
  feeding_time: string | null;
  portion_number: number | null;
  amount_served_grams: number;
  amount_eaten_grams: number;
  amount_leftover_grams: number | null;
  appetite_rating: string | null;
  eating_speed: string | null;
  vomited: boolean | null;
  had_diarrhea: boolean | null;
  stool_quality: string | null;
  had_stool?: boolean | null;
  notes?: string | null;
  created_at?: Date;
}

interface FeedingListProps {
  feedings: FeedingData[];
  pets: Pet[];
  foods: Food[];
  onDelete: (id: string) => Promise<void>;
}

// ============================================
// FUNCIONES HELPER
// ============================================

/**
 * Interfaces para agrupación por día y toma
 */
interface MealGroup {
  mealNumber: number;
  feedings: FeedingData[];
}

interface DayGroup {
  date: string;
  mealGroups: MealGroup[];
}

/**
 * Agrupa feedings por fecha y luego por portion_number
 */
function groupByDayAndMeal(feedings: FeedingData[]): DayGroup[] {
  // 1. Agrupar por fecha
  const byDate = new Map<string, FeedingData[]>();

  feedings.forEach((feeding) => {
    const dateValue = feeding.feeding_date as string | Date;
    const dateStr =
      dateValue instanceof Date
        ? format(dateValue, "yyyy-MM-dd")
        : typeof dateValue === "string"
        ? dateValue
        : "";

    if (!dateStr) {
      console.warn("Feeding con fecha inválida:", feeding.id);
      return;
    }

    if (!byDate.has(dateStr)) {
      byDate.set(dateStr, []);
    }
    byDate.get(dateStr)!.push(feeding);
  });

  // 2. Para cada fecha, agrupar por portion_number
  const result: DayGroup[] = [];
  const sortedDates = Array.from(byDate.keys()).sort((a, b) =>
    b.localeCompare(a)
  ); // DESC

  sortedDates.forEach((date) => {
    const feedingsInDate = byDate.get(date)!;

    // Agrupar por portion_number
    const byMeal = new Map<number, FeedingData[]>();
    feedingsInDate.forEach((feeding) => {
      const mealNum = feeding.portion_number || 0;
      if (!byMeal.has(mealNum)) {
        byMeal.set(mealNum, []);
      }
      byMeal.get(mealNum)!.push(feeding);
    });

    // Convertir a array y ordenar
    const mealGroups: MealGroup[] = Array.from(byMeal.entries())
      .map(([mealNumber, feedings]) => ({
        mealNumber,
        feedings: feedings.sort((a, b) => a.pet_name.localeCompare(b.pet_name)),
      }))
      .sort((a, b) => a.mealNumber - b.mealNumber);

    result.push({ date, mealGroups });
  });

  return result;
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export function FeedingList({
  feedings,
  pets,
  foods,
  onDelete,
}: FeedingListProps) {
  const router = useRouter();
  const [filteredFeedings, setFilteredFeedings] = useState(feedings);
  const [selectedPet, setSelectedPet] = useState<string>("all");
  const [selectedFood, setSelectedFood] = useState<string>("all");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Sincronizar filteredFeedings cuando feedings cambia (ej: después de cambiar rango de fechas)
  useEffect(() => {
    setFilteredFeedings(feedings);
    // Resetear filtros locales al cambiar el dataset base
    setSelectedPet("all");
    setSelectedFood("all");
    setSelectedDate("");
  }, [feedings]);

  // Aplicar filtros
  const applyFilters = () => {
    let filtered = [...feedings];

    if (selectedPet !== "all") {
      filtered = filtered.filter((f) => f.pet_id === selectedPet);
    }

    if (selectedFood !== "all") {
      filtered = filtered.filter((f) => f.food_id === selectedFood);
    }

    if (selectedDate) {
      filtered = filtered.filter((f) => f.feeding_date === selectedDate);
    }

    setFilteredFeedings(filtered);
  };

  // Resetear filtros
  const resetFilters = () => {
    setSelectedPet("all");
    setSelectedFood("all");
    setSelectedDate("");
    setFilteredFeedings(feedings);
  };

  // Handle delete
  const handleDeleteConfirm = async () => {
    if (!deleteId) return;

    setIsDeleting(true);
    try {
      await onDelete(deleteId);
      setDeleteId(null);
    } catch (error) {
      console.error("Error al eliminar:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>
            Filtra los registros de alimentación
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Filtro por mascota */}
            <div className="space-y-2">
              <Label>Mascota</Label>
              <Select value={selectedPet} onValueChange={setSelectedPet}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {pets.map((pet) => (
                    <SelectItem key={pet.id} value={pet.id}>
                      {pet.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtro por alimento */}
            <div className="space-y-2">
              <Label>Alimento</Label>
              <Select value={selectedFood} onValueChange={setSelectedFood}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {foods.map((food) => (
                    <SelectItem key={food.id} value={food.id}>
                      {food.brand ? `${food.brand} - ` : ""}
                      {food.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtro por fecha */}
            <div className="space-y-2">
              <Label>Fecha</Label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={applyFilters}>Aplicar filtros</Button>
            <Button variant="outline" onClick={resetFilters}>
              Resetear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de feedings agrupados por fecha */}
      {filteredFeedings.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <UtensilsCrossed className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">Sin registros</h3>
            <p className="text-muted-foreground mb-4">
              No hay registros de alimentación que coincidan con los filtros.
            </p>
            <Button onClick={() => router.push("/feeding/new-unified")}>
              Registrar alimentación
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {groupByDayAndMeal(filteredFeedings).map((dayGroup) => (
            <div key={dayGroup.date} className="space-y-4">
              {/* Encabezado de fecha */}
              <div className="flex items-center gap-3 sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-2 z-10 border-b">
                <h3 className="text-xl font-bold">
                  {(() => {
                    try {
                      const dateObj = new Date(dayGroup.date + "T00:00:00");
                      if (isNaN(dateObj.getTime())) {
                        return dayGroup.date;
                      }
                      return format(dateObj, "EEEE d 'de' MMMM", {
                        locale: es,
                      });
                    } catch (error) {
                      console.error(
                        "Error formateando fecha:",
                        dayGroup.date,
                        error
                      );
                      return dayGroup.date;
                    }
                  })()}
                </h3>
                <Badge variant="secondary">
                  {dayGroup.mealGroups.length} toma
                  {dayGroup.mealGroups.length !== 1 ? "s" : ""}
                </Badge>
              </div>

              {/* Tomas del día (full-width stack) */}
              <div className="space-y-3">
                {dayGroup.mealGroups.map((mealGroup) => (
                  <MealGroupCard
                    key={`${dayGroup.date}-meal-${mealGroup.mealNumber}`}
                    mealNumber={mealGroup.mealNumber}
                    feedings={mealGroup.feedings}
                    onEdit={(id) => router.push(`/feeding/${id}/edit`)}
                    onDelete={(id) => setDeleteId(id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dialog de confirmación de eliminación */}
      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar registro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El registro de alimentación será
              eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
