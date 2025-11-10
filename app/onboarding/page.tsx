import { redirect } from "next/navigation";
import { getCurrentUser, getUserHouseholdId } from "@/lib/auth";
import OnboardingForm from "@/components/onboarding/OnboardingForm";

export default async function OnboardingPage() {
  const user = await getCurrentUser();

  // Si no está autenticado, redirigir a login
  if (!user) {
    redirect("/login");
  }

  // Si ya tiene hogar, redirigir a home
  const householdId = await getUserHouseholdId();
  if (householdId) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🏠</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Configura tu hogar
          </h1>
          <p className="text-gray-600">
            Crea un nuevo hogar o únete a uno existente para empezar
          </p>
        </div>

        <OnboardingForm userName={user.name || user.email || "Usuario"} />
      </div>
    </div>
  );
}
