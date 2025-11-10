import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AlertCircle, ArrowLeft } from 'lucide-react';

export default function FoodNotFound() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-2xl">
      <div className="flex flex-col items-center justify-center text-center space-y-6">
        <div className="p-4 bg-destructive/10 rounded-full">
          <AlertCircle className="h-16 w-16 text-destructive" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Alimento no encontrado</h1>
          <p className="text-muted-foreground max-w-md">
            El alimento que buscas no existe o no tienes permiso para verlo.
          </p>
        </div>
        <Link href="/foods">
          <Button size="lg" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Volver al catálogo
          </Button>
        </Link>
      </div>
    </div>
  );
}
