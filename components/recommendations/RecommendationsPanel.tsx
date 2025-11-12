/**
 * RecommendationsPanel Component
 * Pet SiKness - Panel completo de recomendaciones nutricionales
 */

"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, RefreshCw, Info, Sparkles } from "lucide-react";
import { RecommendationCard } from "./RecommendationCard";
import { NutritionalInsights } from "./NutritionalInsights";
import {
  getRecommendationsForPet,
  getPetsForRecommendations,
} from "@/lib/actions/recommendations";
import type { RecommendationResult } from "@/lib/algorithms/nutrition-recommendations";

// ============================================
// TYPES
// ============================================

interface Pet {
  id: string;
  name: string;
  species: string;
}

// ============================================
// COMPONENT
// ============================================

export function RecommendationsPanel() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [selectedPetId, setSelectedPetId] = useState<string>("");
  const [periodDays, setPeriodDays] = useState<number>(7);
  const [recommendations, setRecommendations] =
    useState<RecommendationResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar mascotas al montar
  useEffect(() => {
    loadPets();
  }, []);

  // Cargar recomendaciones cuando cambie la mascota o período
  useEffect(() => {
    if (selectedPetId) {
      loadRecommendations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPetId, periodDays]);

  const loadPets = async () => {
    const result = await getPetsForRecommendations();
    if (result.ok && result.data) {
      setPets(result.data);
      if (result.data.length > 0) {
        setSelectedPetId(result.data[0].id);
      }
    } else {
      setError(!result.ok ? result.message : "Error al cargar mascotas");
      setLoading(false);
    }
  };

  const loadRecommendations = async () => {
    setLoading(true);
    setError(null);

    const result = await getRecommendationsForPet(selectedPetId, periodDays);

    if (result.ok && result.data) {
      setRecommendations(result.data);
      setError(null);
    } else {
      setError(!result.ok ? result.message : "Error al generar recomendaciones");
      setRecommendations(null);
    }

    setLoading(false);
  };

  const handleRefresh = () => {
    loadRecommendations();
  };

  if (loading && !recommendations) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error && !recommendations) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con controles */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Recomendaciones Nutricionales
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Sugerencias personalizadas basadas en análisis del historial
              </p>
            </div>

            <Button
              onClick={handleRefresh}
              disabled={loading}
              size="sm"
              variant="outline"
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
              />
              Actualizar
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Controles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Selector de mascota */}
            <div>
              <label className="text-sm font-medium mb-2 block">Mascota</label>
              <Select value={selectedPetId} onValueChange={setSelectedPetId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una mascota" />
                </SelectTrigger>
                <SelectContent>
                  {pets.map((pet) => (
                    <SelectItem key={pet.id} value={pet.id}>
                      {pet.species === "cat" ? "🐱" : "🐶"} {pet.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Selector de período */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Período de análisis
              </label>
              <Select
                value={periodDays.toString()}
                onValueChange={(value) => setPeriodDays(Number(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">Últimos 3 días</SelectItem>
                  <SelectItem value="7">Últimos 7 días</SelectItem>
                  <SelectItem value="14">Últimos 14 días</SelectItem>
                  <SelectItem value="30">Últimos 30 días</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Info de especie */}
          {recommendations && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="text-sm">
                Analizando <strong>{recommendations.analysis.petName}</strong> (
                {recommendations.analysis.species === "cat" ? "🐱 Gato" : "🐶 Perro"}
                ) basado en {periodDays} días de historial.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Análisis nutricional */}
      {recommendations && (
        <NutritionalInsights
          analysis={recommendations.analysis}
          requirements={recommendations.requirements}
          gaps={recommendations.gaps}
          periodDays={periodDays}
        />
      )}

      {/* Recomendaciones de alimentos */}
      {recommendations && recommendations.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Alimentos Recomendados ({recommendations.recommendations.length})
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Ordenados por puntuación de idoneidad nutricional
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {recommendations.recommendations.map((rec, idx) => (
                <RecommendationCard
                  key={idx}
                  recommendation={rec}
                  showDetails={true}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sin recomendaciones */}
      {recommendations && recommendations.recommendations.length === 0 && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Balance nutricional óptimo.</strong> No se detectaron
            deficiencias significativas que requieran ajustes en la dieta.
          </AlertDescription>
        </Alert>
      )}

      {/* Error state */}
      {error && recommendations && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
