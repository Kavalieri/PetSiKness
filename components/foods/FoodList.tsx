"use client";

import { useState, useEffect } from "react";
import { Search, Filter, UtensilsCrossed } from "lucide-react";
import Link from "next/link";
import { searchFoods } from "@/app/foods/actions";
import { FoodCard } from "./FoodCard";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { FOOD_TYPE_OPTIONS, SPECIES_OPTIONS } from "@/lib/constants/foods";
import type { Foods } from "@/types/database.generated";

// ============================================
// CLIENT COMPONENT - Interactive Food List
// ============================================

/**
 * FoodList Component
 *
 * Displays a grid of FoodCard components with search and filter capabilities
 *
 * Features:
 * - Text search (name, brand, ingredients)
 * - Food type filter
 * - Species filter
 * - Minimum protein filter
 * - Sort options
 * - Empty state
 * - Error handling
 * - Loading state
 *
 * @example
 * <FoodList />
 */
export function FoodList() {
  // ============================================
  // State Management
  // ============================================

  const [foods, setFoods] = useState<Foods[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [foodType, setFoodType] = useState<string>("all");
  const [species, setSpecies] = useState<string>("all");
  const [minProtein, setMinProtein] = useState(0);
  const [sortBy, setSortBy] = useState<string>("name");

  // UI states
  const [showFilters, setShowFilters] = useState(false);

  // ============================================
  // Data Fetching
  // ============================================

  useEffect(() => {
    async function loadFoods() {
      setLoading(true);
      setError(null);

      try {
        // Build filters object
        const filters: {
          search?: string;
          food_type?: string;
          species?: string;
          min_protein?: number;
        } = {};

        if (searchTerm.trim()) {
          filters.search = searchTerm.trim();
        }

        if (foodType !== "all") {
          filters.food_type = foodType;
        }

        if (species !== "all") {
          filters.species = species;
        }

        if (minProtein > 0) {
          filters.min_protein = minProtein;
        }

        // Fetch with filters
        const result = await searchFoods(filters);

        if (!result.ok) {
          setError(result.message);
          setFoods([]);
          return;
        }

        // Sort results
        let sortedFoods = result.data || [];

        switch (sortBy) {
          case "name":
            sortedFoods = [...sortedFoods].sort((a, b) =>
              String(a.name).localeCompare(String(b.name))
            );
            break;
          case "protein":
            sortedFoods = [...sortedFoods].sort((a, b) => {
              const proteinA = a.protein_percentage
                ? Number(a.protein_percentage)
                : 0;
              const proteinB = b.protein_percentage
                ? Number(b.protein_percentage)
                : 0;
              return proteinB - proteinA; // Descending
            });
            break;
          case "calories":
            sortedFoods = [...sortedFoods].sort((a, b) => {
              const calA = a.calories_per_100g
                ? Number(a.calories_per_100g)
                : 0;
              const calB = b.calories_per_100g
                ? Number(b.calories_per_100g)
                : 0;
              return calB - calA; // Descending
            });
            break;
          case "price":
            sortedFoods = [...sortedFoods].sort((a, b) => {
              const priceA = a.price_per_package
                ? Number(a.price_per_package)
                : 0;
              const priceB = b.price_per_package
                ? Number(b.price_per_package)
                : 0;
              return priceA - priceB; // Ascending
            });
            break;
          case "created":
            sortedFoods = [...sortedFoods].sort((a, b) => {
              const dateA = new Date(String(a.created_at)).getTime();
              const dateB = new Date(String(b.created_at)).getTime();
              return dateB - dateA; // Most recent first
            });
            break;
        }

        setFoods(sortedFoods);
      } catch (err) {
        console.error("[FoodList] Error:", err);
        setError(
          err instanceof Error ? err.message : "Error al cargar alimentos"
        );
        setFoods([]);
      } finally {
        setLoading(false);
      }
    }

    loadFoods();
  }, [searchTerm, foodType, species, minProtein, sortBy]);

  // ============================================
  // Reset Filters
  // ============================================

  const handleResetFilters = () => {
    setSearchTerm("");
    setFoodType("all");
    setSpecies("all");
    setMinProtein(0);
    setSortBy("name");
  };

  // ============================================
  // Error State
  // ============================================

  if (error) {
    return (
      <Alert variant="destructive" className="my-4">
        <AlertTitle>Error al cargar alimentos</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  // ============================================
  // Loading State
  // ============================================

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="mt-4 text-muted-foreground">Cargando alimentos...</p>
        </div>
      </div>
    );
  }

  // ============================================
  // Empty State
  // ============================================

  if (
    foods.length === 0 &&
    !searchTerm &&
    foodType === "all" &&
    species === "all" &&
    minProtein === 0
  ) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="mb-6">
          <UtensilsCrossed
            className="h-24 w-24 text-muted-foreground/40"
            strokeWidth={1.5}
          />
        </div>

        <h3 className="text-2xl font-semibold mb-2">
          Aún no tienes alimentos registrados
        </h3>

        <p className="text-muted-foreground mb-6 max-w-md">
          Añade tu primer alimento para comenzar a hacer seguimiento de la
          alimentación de tus mascotas.
        </p>

        <Button asChild size="lg">
          <Link href="/foods/new">Añadir primer alimento</Link>
        </Button>
      </div>
    );
  }

  // ============================================
  // No Results State (with active filters)
  // ============================================

  if (foods.length === 0) {
    return (
      <div className="space-y-4">
        {/* Search and Filters Bar */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex-1 w-full sm:max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar por nombre, marca, ingredientes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant={showFilters ? "secondary" : "outline"}
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtros
            </Button>

            <Button variant="outline" size="sm" onClick={handleResetFilters}>
              Limpiar
            </Button>
          </div>
        </div>

        {/* No Results Message */}
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            No se encontraron alimentos con los filtros aplicados.
          </p>
          <Button variant="link" onClick={handleResetFilters} className="mt-2">
            Limpiar filtros
          </Button>
        </div>
      </div>
    );
  }

  // ============================================
  // Main Render - Food Grid
  // ============================================

  return (
    <div className="space-y-6">
      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 w-full sm:max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar por nombre, marca, ingredientes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            variant={showFilters ? "secondary" : "outline"}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </Button>

          <Button variant="outline" size="sm" onClick={handleResetFilters}>
            Limpiar
          </Button>
        </div>
      </div>

      {/* Filters Panel (Collapsible) */}
      {showFilters && (
        <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Food Type Filter */}
            <div className="space-y-2">
              <Label htmlFor="food-type">Tipo de Alimento</Label>
              <Select value={foodType} onValueChange={setFoodType}>
                <SelectTrigger id="food-type">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {FOOD_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.emoji} {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Species Filter */}
            <div className="space-y-2">
              <Label htmlFor="species">Especie</Label>
              <Select value={species} onValueChange={setSpecies}>
                <SelectTrigger id="species">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {SPECIES_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.emoji} {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sort By */}
            <div className="space-y-2">
              <Label htmlFor="sort">Ordenar por</Label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger id="sort">
                  <SelectValue placeholder="Nombre" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Nombre (A-Z)</SelectItem>
                  <SelectItem value="protein">Proteína (Mayor)</SelectItem>
                  <SelectItem value="calories">Calorías (Mayor)</SelectItem>
                  <SelectItem value="price">Precio (Menor)</SelectItem>
                  <SelectItem value="created">Reciente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Min Protein Slider */}
            <div className="space-y-2">
              <Label htmlFor="min-protein">
                Proteína Mínima: {minProtein}%
              </Label>
              <Slider
                id="min-protein"
                min={0}
                max={60}
                step={5}
                value={[minProtein]}
                onValueChange={(value) => setMinProtein(value[0])}
                className="mt-2"
              />
            </div>
          </div>
        </div>
      )}

      {/* Results Counter */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {foods.length} {foods.length === 1 ? "alimento" : "alimentos"}{" "}
          {searchTerm ||
          foodType !== "all" ||
          species !== "all" ||
          minProtein > 0
            ? "encontrados"
            : "registrados"}
        </p>
      </div>

      {/* Food Grid - 1 columna móvil, 2 tablet/desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {foods.map((food) => (
          <FoodCard
            key={String(food.id)}
            food={food}
            onDelete={async () => {
              // Refresh list after delete
              const result = await searchFoods({
                search: searchTerm || undefined,
                food_type: foodType !== "all" ? foodType : undefined,
                species: species !== "all" ? species : undefined,
                min_protein: minProtein > 0 ? minProtein : undefined,
              });

              if (result.ok) {
                setFoods(result.data || []);
              }
            }}
          />
        ))}
      </div>
    </div>
  );
}
