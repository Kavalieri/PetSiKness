"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================
// TYPES
// ============================================

interface FilterOption {
  label: string;
  value: string;
}

interface TableFiltersProps {
  /**
   * Búsqueda global
   */
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;

  /**
   * Filtros de selección
   */
  filters?: Array<{
    id: string;
    label: string;
    value?: string;
    options: FilterOption[];
    onChange: (value: string) => void;
  }>;

  /**
   * Callback para resetear todos los filtros
   */
  onReset?: () => void;

  /**
   * Clases CSS adicionales
   */
  className?: string;
}

// ============================================
// COMPONENT
// ============================================

/**
 * Barra de filtros para tablas
 * 
 * Provee:
 * - Búsqueda global
 * - Filtros por categorías (mascota, alimento, etc.)
 * - Botón reset
 * - Responsive (stack en móvil)
 * 
 * @example
 * ```tsx
 * <TableFilters
 *   searchValue={search}
 *   onSearchChange={setSearch}
 *   searchPlaceholder="Buscar alimento..."
 *   filters={[
 *     {
 *       id: "pet",
 *       label: "Mascota",
 *       value: petId,
 *       options: pets.map(p => ({ label: p.name, value: p.id })),
 *       onChange: setPetId,
 *     },
 *   ]}
 *   onReset={() => {
 *     setSearch("");
 *     setPetId("");
 *   }}
 * />
 * ```
 */
export function TableFilters({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Buscar...",
  filters = [],
  onReset,
  className,
}: TableFiltersProps) {
  const hasActiveFilters = Boolean(
    searchValue || filters.some((f) => f.value)
  );

  return (
    <div className={cn("space-y-4", className)}>
      {/* Búsqueda */}
      {onSearchChange && (
        <div className="w-full md:w-80">
          <Input
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-10"
          />
        </div>
      )}

      {/* Filtros + Reset */}
      {filters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {/* Filtros de selección */}
          {filters.map((filter) => (
            <Select
              key={filter.id}
              value={filter.value}
              onValueChange={filter.onChange}
            >
              <SelectTrigger className="h-10 w-[180px]">
                <SelectValue placeholder={filter.label} />
              </SelectTrigger>
              <SelectContent>
                {filter.options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ))}

          {/* Botón Reset */}
          {hasActiveFilters && onReset && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="h-10 px-3"
            >
              <X className="mr-2 h-4 w-4" />
              Limpiar filtros
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
