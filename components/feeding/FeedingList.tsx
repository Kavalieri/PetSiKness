"use client";

import { useState } from "react";
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
import {
  TrendingDown,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Edit,
  UtensilsCrossed,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";

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
  meal_number: number | null;
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

interface FeedingCardProps {
  feeding: FeedingData;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

// ============================================
// MAPEOS Y CONFIGURACIÓN
// ============================================

const appetiteConfig = {
  refused: { label: "Rechazado", variant: "destructive" as const },
  poor: { label: "Pobre", variant: "secondary" as const },
  normal: { label: "Normal", variant: "default" as const },
  good: { label: "Bueno", variant: "default" as const },
  excellent: { label: "Excelente", variant: "default" as const },
};

const speedConfig = {
  very_slow: { label: "Muy lento", color: "text-red-600" },
  slow: { label: "Lento", color: "text-orange-600" },
  normal: { label: "Normal", color: "text-blue-600" },
  fast: { label: "Rápido", color: "text-green-600" },
  very_fast: { label: "Muy rápido", color: "text-green-700" },
};

const stoolConfig = {
  liquid: { label: "Líquida", variant: "destructive" as const },
  soft: { label: "Blanda", variant: "secondary" as const },
  normal: { label: "Normal", variant: "default" as const },
  hard: { label: "Dura", variant: "secondary" as const },
};

// ============================================
// COMPONENTE CARD INDIVIDUAL
// ============================================

function FeedingCard({ feeding, onEdit, onDelete }: FeedingCardProps) {
  const eatenPercentage =
    (feeding.amount_eaten_grams / feeding.amount_served_grams) * 100;

  // Determinar estado de alimentación
  let statusIcon;
  let statusColor;
  if (eatenPercentage >= 90) {
    statusIcon = <CheckCircle2 className="h-5 w-5 text-green-600" />;
    statusColor = "text-green-700";
  } else if (eatenPercentage >= 70) {
    statusIcon = <TrendingDown className="h-5 w-5 text-yellow-600" />;
    statusColor = "text-yellow-700";
  } else {
    statusIcon = <TrendingDown className="h-5 w-5 text-red-600" />;
    statusColor = "text-red-700";
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{feeding.pet_name}</CardTitle>
            <CardDescription>
              {feeding.food_brand ? `${feeding.food_brand} - ` : ""}
              {feeding.food_name}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(feeding.id)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(feeding.id)}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Fecha y hora */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {format(new Date(feeding.feeding_date), "PPP", { locale: es })}
          </span>
          {feeding.feeding_time && (
            <span className="font-medium">
              {feeding.feeding_time.slice(0, 5)}
              {feeding.meal_number && ` (Comida #${feeding.meal_number})`}
            </span>
          )}
        </div>

        {/* Cantidades con indicador visual */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Cantidad comida</span>
            <div className="flex items-center gap-2">
              {statusIcon}
              <span className={`font-bold ${statusColor}`}>
                {eatenPercentage.toFixed(0)}%
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="text-center p-2 bg-muted rounded">
              <p className="text-muted-foreground">Servido</p>
              <p className="font-semibold">{feeding.amount_served_grams}g</p>
            </div>
            <div className="text-center p-2 bg-primary/10 rounded">
              <p className="text-muted-foreground">Comido</p>
              <p className="font-semibold">{feeding.amount_eaten_grams}g</p>
            </div>
            <div className="text-center p-2 bg-muted rounded">
              <p className="text-muted-foreground">Sobra</p>
              <p className="font-semibold">{feeding.amount_leftover_grams}g</p>
            </div>
          </div>
        </div>

        {/* Comportamiento */}
        <div className="flex flex-wrap gap-2">
          {feeding.appetite_rating &&
            appetiteConfig[
              feeding.appetite_rating as keyof typeof appetiteConfig
            ] && (
              <Badge
                variant={
                  appetiteConfig[
                    feeding.appetite_rating as keyof typeof appetiteConfig
                  ].variant
                }
              >
                Apetito:{" "}
                {
                  appetiteConfig[
                    feeding.appetite_rating as keyof typeof appetiteConfig
                  ].label
                }
              </Badge>
            )}
          {feeding.eating_speed &&
            speedConfig[feeding.eating_speed as keyof typeof speedConfig] && (
              <Badge
                variant="outline"
                className={
                  speedConfig[feeding.eating_speed as keyof typeof speedConfig]
                    .color
                }
              >
                Velocidad:{" "}
                {
                  speedConfig[feeding.eating_speed as keyof typeof speedConfig]
                    .label
                }
              </Badge>
            )}
        </div>

        {/* Alertas de salud */}
        {(feeding.vomited || feeding.had_diarrhea || feeding.stool_quality) && (
          <div className="space-y-1 p-3 border-l-4 border-destructive bg-destructive/5 rounded">
            <div className="flex items-center gap-2 text-sm font-medium text-destructive">
              <AlertTriangle className="h-4 w-4" />
              Alertas de salud
            </div>
            <div className="space-y-1 text-xs">
              {feeding.vomited && <p>• Vómito registrado</p>}
              {feeding.had_diarrhea && <p>• Diarrea registrada</p>}
              {feeding.stool_quality &&
                stoolConfig[
                  feeding.stool_quality as keyof typeof stoolConfig
                ] && (
                  <p>
                    • Heces:{" "}
                    {
                      stoolConfig[
                        feeding.stool_quality as keyof typeof stoolConfig
                      ].label
                    }
                  </p>
                )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================
// FUNCIONES HELPER
// ============================================

/**
 * Agrupa feedings por fecha
 */
function groupByDate(feedings: FeedingData[]): Map<string, FeedingData[]> {
  const grouped = new Map<string, FeedingData[]>();

  feedings.forEach((feeding) => {
    // Validación defensiva: ignorar registros sin fecha válida
    const date = feeding.feeding_date;
    if (!date || typeof date !== 'string') {
      console.warn('Feeding con fecha inválida:', feeding.id);
      return;
    }
    
    if (!grouped.has(date)) {
      grouped.set(date, []);
    }
    grouped.get(date)!.push(feeding);
  });

  // Ordenar cada grupo por hora
  grouped.forEach((group) => {
    group.sort((a, b) => {
      const timeA = a.feeding_time || "00:00";
      const timeB = b.feeding_time || "00:00";
      return timeB.localeCompare(timeA); // DESC (más reciente primero)
    });
  });

  return grouped;
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
            <Button onClick={() => router.push("/feeding/new")}>
              Registrar alimentación
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Array.from(groupByDate(filteredFeedings).entries()).map(
            ([date, feedingsInDate]) => (
              <div key={date} className="space-y-3">
                {/* Encabezado de fecha */}
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold">
                    {(() => {
                      try {
                        // Parsear fecha con formato ISO
                        const dateObj = new Date(date + "T00:00:00");
                        if (isNaN(dateObj.getTime())) {
                          return date; // Fallback a mostrar string crudo
                        }
                        return format(dateObj, "EEEE d 'de' MMMM", {
                          locale: es,
                        });
                      } catch (error) {
                        console.error('Error formateando fecha:', date, error);
                        return date; // Fallback
                      }
                    })()}
                  </h3>
                  <Badge variant="secondary">
                    {feedingsInDate.length} registro
                    {feedingsInDate.length !== 1 ? "s" : ""}
                  </Badge>
                </div>

                {/* Grid de cards para esa fecha */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {feedingsInDate.map((feeding) => (
                    <FeedingCard
                      key={feeding.id}
                      feeding={feeding}
                      onEdit={(id) => router.push(`/feeding/${id}/edit`)}
                      onDelete={(id) => setDeleteId(id)}
                    />
                  ))}
                </div>
              </div>
            )
          )}
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
