'use client';

import { FoodForm } from '@/components/foods/FoodForm';
import { useRouter } from 'next/navigation';
import { ArrowLeft, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function NewFoodPage() {
  const router = useRouter();

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Breadcrumb o botón volver */}
      <div className="mb-6">
        <Link href="/foods">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Volver al catálogo
          </Button>
        </Link>
      </div>

      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
          <PlusCircle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Añadir Alimento</h1>
          <p className="text-muted-foreground">
            Registra un nuevo alimento en tu catálogo
          </p>
        </div>
      </div>

      {/* Tips de ayuda */}
      <Card className="mb-8 border-blue-200 dark:border-blue-900">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            💡 Consejos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Los campos con <span className="text-destructive">*</span> son obligatorios</li>
            <li>• Revisa la etiqueta del producto para datos nutricionales exactos</li>
            <li>• Puedes editar esta información más tarde</li>
            <li>• La suma de macronutrientes (proteína + grasa + carbohidratos) no debe exceder 100%</li>
          </ul>
        </CardContent>
      </Card>

      {/* Formulario */}
      <div>
        <FoodForm
          onSuccess={() => router.push('/foods')}
          onCancel={() => router.back()}
        />
      </div>
    </div>
  );
}
