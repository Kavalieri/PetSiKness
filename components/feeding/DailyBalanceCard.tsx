"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  TrendingDown,
  TrendingUp,
  Check,
  AlertTriangle,
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getPortionName } from "@/lib/utils/portion-schedule";
import {
  getStatusIcon,
  getStatusLabel,
  getStatusColor,
  type MealBalance,
} from "@/lib/utils/portion-balance";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updatePortionAmount } from "@/app/dashboard/actions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

// ============================================
// TIPOS
// ============================================

interface DailyBalanceData {
  pet_id: string;
  pet_name: string;
  total_served: number;
  total_eaten: number;
  total_leftover: number;
  daily_goal: number;
  achievement_pct: number;
  status: "under" | "met" | "over";
  meal_balances?: MealBalance[]; // ✨ NUEVO: Balances por toma
}

interface DailyBalanceCardProps {
  data: DailyBalanceData;
  compact?: boolean;
}

interface DailyBalanceListProps {
  balances: DailyBalanceData[];
  compact?: boolean;
}

// ============================================
// MAPEOS DE ESTADO
// ============================================

const statusConfig = {
  under: {
    color: "destructive" as const,
    icon: TrendingDown,
    label: "🔴 Bajo objetivo",
    progressColor: "bg-red-500",
    alertVariant: "destructive" as const,
    alertMessage: "Necesita más alimentación para cumplir el objetivo diario.",
  },
  met: {
    color: "default" as const,
    icon: Check,
    label: "🟢 Cumplido",
    progressColor: "bg-green-500",
    alertVariant: "default" as const,
    alertMessage: "¡Perfecto! Ha cumplido su objetivo diario de alimentación.",
  },
  over: {
    color: "secondary" as const,
    icon: TrendingUp,
    label: "🟡 Sobre objetivo",
    progressColor: "bg-yellow-500",
    alertVariant: "default" as const,
    alertMessage:
      "Ha superado el objetivo diario. Monitorear peso y condición corporal.",
  },
};

// ============================================
// COMPONENTES NUEVOS - BALANCE POR TOMA
// ============================================

/**
 * Card individual de una toma
 */
function MealCard({
  balance,
  petId,
  petName,
  onUpdate,
}: {
  balance: MealBalance;
  petId: string;
  petName: string;
  onUpdate?: () => void;
}) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [served, setServed] = useState(balance.served_grams?.toString() || "");
  const [leftover, setLeftover] = useState(
    balance.leftover_grams?.toString() || ""
  ); // ✨ CAMBIO: Ahora es input (antes eaten)
  const [isSaving, setIsSaving] = useState(false);

  const statusIcon = getStatusIcon(balance.status);
  const statusLabel = getStatusLabel(balance.status);
  const statusColorClass = getStatusColor(balance.status);

  // Todos los valores disponibles
  const expectedGrams = balance.expected_grams || 0;
  const servedGrams = balance.served_grams || 0;
  const eatenGrams = balance.eaten_grams || 0;
  const leftoverGrams = balance.leftover_grams || 0;

  // Comido / Servido (correcto: comido primero)
  const consumptionRate =
    servedGrams > 0 ? Math.round((eatenGrams / servedGrams) * 100) : 0;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const result = await updatePortionAmount({
        petId,
        portionNumber: balance.portion_number,
        servedGrams: Number(served),
        leftoverGrams: Number(leftover), // ✨ CAMBIO: Enviar leftover (antes eaten)
      });

      if (!result.ok) {
        toast.error("Error", {
          description: result.message,
        });
        return;
      }

      toast.success("Ración actualizada", {
        description: `${getPortionName(
          balance.portion_number
        )} de ${petName} actualizada correctamente`,
      });

      // Cerrar diálogo
      setIsEditing(false);

      // Recargar página para reflejar cambios
      router.refresh();

      // Callback si existe
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error("Error actualizando ración:", error);
      toast.error("Error inesperado", {
        description: "No se pudo actualizar la ración",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div className="p-4 border rounded-lg bg-card hover:shadow-md transition-shadow">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-lg font-semibold">
              {getPortionName(balance.portion_number)}
            </span>
            <span className="text-sm text-muted-foreground">
              {balance.actual_time || balance.scheduled_time}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={statusColorClass} variant="outline">
              {statusIcon} {statusLabel}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(true)}
              title="Editar ración"
            >
              <Pencil className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Datos - Grid fijo 4 columnas */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          <div className="text-center p-2 bg-purple-50 dark:bg-purple-950/30 rounded">
            <div className="text-xs text-muted-foreground mb-1">Esperado</div>
            <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
              {expectedGrams}g
            </div>
          </div>

          <div className="text-center p-2 bg-blue-50 dark:bg-blue-950/30 rounded">
            <div className="text-xs text-muted-foreground mb-1">Servido</div>
            <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
              {servedGrams}g
            </div>
          </div>

          <div className="text-center p-2 bg-green-50 dark:bg-green-950/30 rounded">
            <div className="text-xs text-muted-foreground mb-1">Comido</div>
            <div className="text-lg font-bold text-green-600 dark:text-green-400">
              {eatenGrams}g
            </div>
          </div>

          <div className="text-center p-2 bg-yellow-50 dark:bg-yellow-950/30 rounded">
            <div className="text-xs text-muted-foreground mb-1">Sobra</div>
            <div className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
              {leftoverGrams}g
            </div>
          </div>
        </div>

        {/* Métrica: Comido/Servido */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Comido / Servido</span>
            <span className="font-semibold">{consumptionRate}%</span>
          </div>
          <Progress value={Math.min(consumptionRate, 100)} className="h-2" />
          <div className="text-xs text-muted-foreground text-center">
            {eatenGrams}g / {servedGrams}g
          </div>
        </div>
      </div>

      {/* Diálogo de edición */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Editar {getPortionName(balance.portion_number)} - {petName}
            </DialogTitle>
            <DialogDescription>
              Modifica las cantidades servida y comida para esta ración
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="served">Cantidad servida (gramos)</Label>
              <Input
                id="served"
                type="number"
                value={served}
                onChange={(e) => setServed(e.target.value)}
                min="0"
                step="1"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="leftover">
                Cantidad que sobró (gramos) ✨ NUEVO
              </Label>
              <Input
                id="leftover"
                type="number"
                value={leftover}
                onChange={(e) => setLeftover(e.target.value)}
                min="0"
                step="1"
                max={served}
              />
              <p className="text-xs text-muted-foreground">
                Registra lo que quedó en el plato al final
              </p>
            </div>

            <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded">
              <strong>Comido (calculado):</strong>{" "}
              {Math.max(0, Number(served) - Number(leftover))}g
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditing(false)}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/**
 * Versión compacta: lista de tomas + resumen
 */
function MealBasedBalanceCompact({ data }: { data: DailyBalanceData }) {
  if (!data.meal_balances || data.meal_balances.length === 0) return null;

  const completedMeals = data.meal_balances.filter(
    (m) => m.status === "completed"
  ).length;
  const totalMeals = data.meal_balances.length;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">{data.pet_name}</h3>
            <span className="text-sm text-muted-foreground">
              {completedMeals}/{totalMeals} completadas
            </span>
          </div>

          {/* Lista de tomas (mini cards) */}
          <div className="space-y-2">
            {data.meal_balances.map((balance) => (
              <div
                key={balance.portion_number}
                className="flex flex-col p-2 bg-muted/50 rounded text-xs gap-1"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span>{getStatusIcon(balance.status)}</span>
                    <span className="font-medium">
                      {getPortionName(balance.portion_number)}
                    </span>
                    <span className="text-muted-foreground">
                      {/* ✨ Mostrar hora real si existe */}
                      {balance.actual_time || balance.scheduled_time}
                    </span>
                  </div>
                  <span className="font-semibold">
                    {/* Datos reales: Servido / Comido */}
                    {balance.served_grams}g / {balance.eaten_grams}g
                  </span>
                </div>
                {/* Sobra si existe */}
                {balance.leftover_grams > 0 && (
                  <div className="pl-6 text-[10px] text-yellow-600">
                    Sobra: {balance.leftover_grams}g
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Resumen total */}
          <div className="pt-2 border-t">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Servido total</span>
              <span className="font-semibold">{data.total_served}g</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Comido total</span>
              <span className="font-semibold text-green-600">
                {data.total_eaten}g
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Versión completa: cards expandidos por toma + resumen
 */
function MealBasedBalanceFull({ data }: { data: DailyBalanceData }) {
  if (!data.meal_balances || data.meal_balances.length === 0) return null;

  const completedMeals = data.meal_balances.filter(
    (m) => m.status === "completed"
  ).length;
  const delayedMeals = data.meal_balances.filter(
    (m) => m.status === "delayed"
  ).length;
  const totalMeals = data.meal_balances.length;

  // Determinar badge general
  const config = statusConfig[data.status];
  const Icon = config.icon;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">{data.pet_name}</CardTitle>
          <Badge variant={config.color} className="text-sm">
            <Icon className="h-4 w-4 mr-1" />
            {completedMeals}/{totalMeals} tomas
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Meal cards horizontales full-width */}
        <div className="flex flex-col gap-3">
          {data.meal_balances.map((balance) => (
            <MealCard
              key={balance.portion_number}
              balance={balance}
              petId={data.pet_id}
              petName={data.pet_name}
            />
          ))}
        </div>

        {/* Resumen general */}
        <div className="p-4 bg-muted/50 rounded-lg space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Progreso del día</span>
            <span className="text-xl font-bold">
              {data.achievement_pct.toFixed(1)}%
            </span>
          </div>

          {/* Datos reales del día */}
          <div className="grid grid-cols-3 gap-2 text-center text-sm">
            <div>
              <p className="text-muted-foreground">Servido</p>
              <p className="font-bold text-primary">{data.total_served}g</p>
            </div>
            <div>
              <p className="text-muted-foreground">Comido</p>
              <p className="font-bold text-green-600">{data.total_eaten}g</p>
            </div>
            <div>
              <p className="text-muted-foreground">Sobra</p>
              <p className="font-bold text-yellow-600">
                {data.total_leftover}g
              </p>
            </div>
          </div>

          {/* Tasa de consumo */}
          <div className="text-center text-xs text-muted-foreground pt-2 border-t">
            Tasa de consumo:{" "}
            <span className="font-semibold text-foreground">
              {data.total_served > 0
                ? ((data.total_eaten / data.total_served) * 100).toFixed(0)
                : 0}
              %
            </span>
          </div>
        </div>

        {/* Alerta si hay retrasos */}
        {delayedMeals > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {delayedMeals === 1
                ? "Hay 1 toma retrasada"
                : `Hay ${delayedMeals} tomas retrasadas`}
              . Considera alimentar a {data.pet_name} pronto.
            </AlertDescription>
          </Alert>
        )}

        {/* Alerta de cumplimiento */}
        {delayedMeals === 0 && completedMeals === totalMeals && (
          <Alert>
            <Check className="h-4 w-4" />
            <AlertDescription>
              ¡Excelente! Todas las tomas del día han sido completadas.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export function DailyBalanceCard({
  data,
  compact = false,
}: DailyBalanceCardProps) {
  const config = statusConfig[data.status];
  const Icon = config.icon;

  // ✨ NUEVO: Si tenemos balances por toma, mostrar diseño nuevo
  if (data.meal_balances && data.meal_balances.length > 0) {
    return compact ? (
      <MealBasedBalanceCompact data={data} />
    ) : (
      <MealBasedBalanceFull data={data} />
    );
  }

  // ⚠️ LEGACY: Si no hay meal_balances, mostrar diseño antiguo
  // Calcular porcentaje para progress bar (cap at 100)
  const progressValue = Math.min(100, data.achievement_pct);

  if (compact) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-3">
            {/* Header compacto */}
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{data.pet_name}</h3>
              <Badge variant={config.color}>
                <Icon className="h-3 w-3 mr-1" />
                {config.label}
              </Badge>
            </div>

            {/* Progress bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progreso</span>
                <span className="font-semibold">
                  {data.achievement_pct.toFixed(1)}%
                </span>
              </div>
              <Progress value={progressValue} className="h-2" />
            </div>

            {/* Stats compactas */}
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <p className="text-muted-foreground">Servido</p>
                <p className="font-semibold">{data.total_served}g</p>
              </div>
              <div>
                <p className="text-muted-foreground">Comido</p>
                <p className="font-semibold text-green-600">
                  {data.total_eaten}g
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Sobra</p>
                <p className="font-semibold text-yellow-600">
                  {data.total_leftover}g
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">{data.pet_name}</CardTitle>
          <Badge variant={config.color} className="text-sm">
            <Icon className="h-4 w-4 mr-1" />
            {config.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress bar principal */}
        {/* Tasa de consumo */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Tasa de Consumo</span>
            <span className="text-2xl font-bold">
              {data.total_served > 0
                ? ((data.total_eaten / data.total_served) * 100).toFixed(1)
                : 0}
              %
            </span>
          </div>
          <Progress
            value={
              data.total_served > 0
                ? Math.min((data.total_eaten / data.total_served) * 100, 100)
                : 0
            }
            className="h-3"
          />
          <div className="text-xs text-muted-foreground text-center">
            Comido / Servido: {data.total_eaten}g / {data.total_served}g
          </div>
        </div>

        {/* Estadísticas detalladas */}
        <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-1">Servido</p>
            <p className="text-xl font-bold">{data.total_served}g</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-1">Comido</p>
            <p className="text-xl font-bold text-green-600">
              {data.total_eaten}g
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-1">Sobra</p>
            <p className="text-xl font-bold text-yellow-600">
              {data.total_leftover}g
            </p>
          </div>
        </div>

        {/* Alerta contextual */}
        <Alert variant={config.alertVariant}>
          <Icon className="h-4 w-4" />
          <AlertDescription>{config.alertMessage}</AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}

// ============================================
// COMPONENTE LISTA
// ============================================

export function DailyBalanceList({
  balances,
  compact = false,
}: DailyBalanceListProps) {
  if (balances.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold text-lg mb-2">
            Sin datos de alimentación
          </h3>
          <p className="text-muted-foreground">
            No hay registros de alimentación para hoy. <br />
            Registra la primera comida para ver el balance.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {balances.map((balance) => (
        <DailyBalanceCard
          key={balance.pet_id}
          data={balance}
          compact={compact}
        />
      ))}
    </div>
  );
}
