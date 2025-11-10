import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth-options";
import LoginButton from "@/components/auth/LoginButton";

export default async function LoginPage() {
  // Si ya está autenticado, redirigir a home
  const session = await getServerSession(authOptions);
  if (session) {
    redirect("/");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-8">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-8">
          {/* Logo y título */}
          <div className="text-center">
            <div className="text-6xl mb-4">🐾</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Pet SiKness
            </h1>
            <p className="text-gray-600">
              Gestiona la alimentación de tus mascotas
            </p>
          </div>

          {/* Características */}
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="text-2xl">📊</div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  Seguimiento diario
                </h3>
                <p className="text-sm text-gray-600">
                  Registra cada comida y monitorea el balance nutricional
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="text-2xl">🎯</div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  Metas personalizadas
                </h3>
                <p className="text-sm text-gray-600">
                  Define objetivos diarios para cada mascota
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="text-2xl">👨‍👩‍👧‍👦</div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  Hogar compartido
                </h3>
                <p className="text-sm text-gray-600">
                  Toda la familia puede colaborar en el cuidado
                </p>
              </div>
            </div>
          </div>

          {/* Botón de login */}
          <div className="pt-4">
            <LoginButton />
          </div>

          {/* Info adicional */}
          <p className="text-xs text-gray-500 text-center">
            Al continuar, aceptas nuestros términos de servicio y política de
            privacidad
          </p>
        </div>
      </div>
    </div>
  );
}
