"use client";

import React, { useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { deletePet } from "@/app/pets/actions";
import { useToast } from "@/hooks/use-toast";
import type { Pets } from "@/types/database.generated";

/**
 * Props para el componente PetDeleteDialog
 */
interface PetDeleteDialogProps {
  /** Mascota a eliminar */
  pet: Pets;
  /** Estado de visibilidad del dialog */
  open: boolean;
  /** Handler para cambiar estado de visibilidad */
  onOpenChange: (open: boolean) => void;
  /** Callback opcional ejecutado tras eliminación exitosa */
  onSuccess?: () => void;
}

/**
 * Dialog de confirmación para eliminar una mascota
 *
 * Muestra advertencias claras y requiere confirmación explícita.
 * Integrado con Server Action deletePet() y toast notifications.
 *
 * @example
 * ```tsx
 * <PetDeleteDialog
 *   pet={selectedPet}
 *   open={isDialogOpen}
 *   onOpenChange={setIsDialogOpen}
 *   onSuccess={() => router.refresh()}
 * />
 * ```
 */
export function PetDeleteDialog({
  pet,
  open,
  onOpenChange,
  onSuccess,
}: PetDeleteDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  /**
   * Handler para confirmar eliminación
   */
  async function handleDelete() {
    setIsDeleting(true);

    try {
      const result = await deletePet(String(pet.id));

      if (result.ok) {
        // Éxito: mostrar toast, cerrar dialog y ejecutar callback
        toast({
          title: "Mascota eliminada",
          description: `${pet.name} ha sido eliminado correctamente.`,
        });

        // Cerrar dialog
        onOpenChange(false);

        // Ejecutar callback si existe (para refresh de lista)
        if (onSuccess) {
          onSuccess();
        }
      } else {
        // Error: mostrar mensaje de error
        toast({
          title: "Error al eliminar",
          description: result.message || "No se pudo eliminar la mascota.",
          variant: "destructive",
        });
      }
    } catch (error) {
      // Error inesperado
      toast({
        title: "Error inesperado",
        description: "Ocurrió un error al intentar eliminar la mascota.",
        variant: "destructive",
      });
      console.error("Error deleting pet:", error);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="h-6 w-6 text-destructive" />
            <DialogTitle>¿Eliminar mascota?</DialogTitle>
          </div>
          <DialogDescription className="text-base">
            Se eliminará a <span className="font-semibold">{pet.name}</span> y
            todos sus datos relacionados (alimentación, historial, etc.).
            <br />
            <br />
            <span className="text-destructive font-semibold">
              Esta acción no se puede deshacer.
            </span>
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isDeleting ? "Eliminando..." : "Eliminar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
