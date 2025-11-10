"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  createHousehold,
  joinHousehold,
  searchHouseholds,
} from "@/lib/actions/household";
import type { Household } from "@/lib/actions/household";

interface OnboardingFormProps {
  userName: string;
}

export default function OnboardingForm({ userName }: OnboardingFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  // Estado para crear hogar
  const [householdName, setHouseholdName] = useState(`Hogar de ${userName}`);

  // Estado para unirse a hogar
  const [searchTerm, setSearchTerm] = useState("");
  const [households, setHouseholds] = useState<Household[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Crear nuevo hogar
  const handleCreateHousehold = () => {
    if (!householdName.trim()) {
      toast({
        title: "Error",
        description: "El nombre del hogar es requerido",
        variant: "destructive",
      });
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.append("name", householdName);

      const result = await createHousehold(formData);

      if (result.ok) {
        toast({
          title: "¡Hogar creado!",
          description: "Tu hogar ha sido creado exitosamente",
        });
        router.push("/");
        router.refresh();
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        });
      }
    });
  };

  // Buscar hogares
  const handleSearch = async () => {
    setIsSearching(true);
    const result = await searchHouseholds(searchTerm);
    setIsSearching(false);

    if (result.ok && result.data) {
      setHouseholds(result.data);
      if (result.data.length === 0) {
        toast({
          title: "Sin resultados",
          description: "No se encontraron hogares con ese nombre",
        });
      }
    } else {
      toast({
        title: "Error",
        description: "Error al buscar hogares",
        variant: "destructive",
      });
    }
  };

  // Unirse a hogar
  const handleJoinHousehold = (householdId: string) => {
    startTransition(async () => {
      const formData = new FormData();
      formData.append("householdId", householdId);

      const result = await joinHousehold(formData);

      if (result.ok) {
        toast({
          title: "¡Te has unido!",
          description: "Te has unido al hogar exitosamente",
        });
        router.push("/");
        router.refresh();
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        });
      }
    });
  };

  return (
    <Tabs defaultValue="create" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="create">Crear Hogar</TabsTrigger>
        <TabsTrigger value="join">Unirse a Hogar</TabsTrigger>
      </TabsList>

      {/* TAB: Crear Hogar */}
      <TabsContent value="create">
        <Card>
          <CardHeader>
            <CardTitle>Crear un nuevo hogar</CardTitle>
            <CardDescription>
              Empieza tu propio hogar y gestiona tus mascotas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="householdName">Nombre del hogar</Label>
              <Input
                id="householdName"
                value={householdName}
                onChange={(e) => setHouseholdName(e.target.value)}
                placeholder="Ej: Hogar de Juan"
                disabled={isPending}
              />
            </div>

            <Button
              onClick={handleCreateHousehold}
              disabled={isPending}
              className="w-full"
            >
              {isPending ? "Creando..." : "Crear Hogar"}
            </Button>

            <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-800">
              <p className="font-semibold mb-1">💡 Tip</p>
              <p>
                Como creador, serás el dueño del hogar y podrás invitar a otros
                miembros más adelante.
              </p>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* TAB: Unirse a Hogar */}
      <TabsContent value="join">
        <Card>
          <CardHeader>
            <CardTitle>Unirse a un hogar existente</CardTitle>
            <CardDescription>
              Busca y únete a un hogar ya creado
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="searchTerm">Buscar hogar por nombre</Label>
              <div className="flex space-x-2">
                <Input
                  id="searchTerm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Nombre del hogar"
                  disabled={isSearching || isPending}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSearch();
                  }}
                />
                <Button
                  onClick={handleSearch}
                  disabled={isSearching || isPending}
                  variant="secondary"
                >
                  {isSearching ? "Buscando..." : "Buscar"}
                </Button>
              </div>
            </div>

            {/* Lista de resultados */}
            {households.length > 0 && (
              <div className="space-y-2">
                <Label>Resultados ({households.length})</Label>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {households.map((household) => (
                    <div
                      key={household.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <div>
                        <p className="font-semibold">{household.name}</p>
                        <p className="text-sm text-gray-500">
                          {household.member_count || 0} miembros
                        </p>
                      </div>
                      <Button
                        onClick={() => handleJoinHousehold(household.id)}
                        disabled={isPending}
                        size="sm"
                      >
                        Unirse
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
              <p className="font-semibold mb-1">⚠️ Importante</p>
              <p>
                Solo puedes pertenecer a un hogar a la vez. Asegúrate de
                seleccionar el correcto.
              </p>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
