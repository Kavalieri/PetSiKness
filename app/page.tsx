import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth-options";
import { getUserHouseholdId } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  // Si está autenticado, verificar si tiene hogar
  if (session) {
    const householdId = await getUserHouseholdId();
    
    // Si no tiene hogar, redirigir a onboarding
    if (!householdId) {
      redirect("/onboarding");
    }
    
    // Si tiene hogar, redirigir a mascotas
    redirect("/pets");
  }

  // Landing page para usuarios no autenticados
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="text-center max-w-2xl">
        <div className="text-8xl mb-6">🐾</div>
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4">
          Pet SiKness
        </h1>
        <p className="text-xl md:text-2xl text-gray-600 mb-8">
          Sistema de gestión alimentaria para mascotas
        </p>
        
        <div className="space-y-6 mb-12">
          <div className="flex items-center justify-center space-x-3 text-left">
            <div className="text-3xl">📊</div>
            <p className="text-lg text-gray-700">
              Monitorea el balance nutricional diario
            </p>
          </div>
          
          <div className="flex items-center justify-center space-x-3 text-left">
            <div className="text-3xl">🎯</div>
            <p className="text-lg text-gray-700">
              Establece metas personalizadas para cada mascota
            </p>
          </div>
          
          <div className="flex items-center justify-center space-x-3 text-left">
            <div className="text-3xl">👨‍👩‍👧‍👦</div>
            <p className="text-lg text-gray-700">
              Colabora con toda tu familia
            </p>
          </div>
        </div>

        <Link href="/login">
          <Button size="lg" className="text-lg px-8 py-6">
            Comenzar ahora
          </Button>
        </Link>

        <p className="text-sm text-gray-500 mt-8">
          Diseñado con ❤️ para el cuidado de tus mascotas
        </p>
      </div>
    </div>
  );
}
