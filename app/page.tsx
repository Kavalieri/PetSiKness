export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">
          🐾 Pet SiKness
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Sistema de gestión alimentaria para mascotas
        </p>
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Base del proyecto configurada correctamente ✅
          </p>
          <p className="text-sm text-gray-500">
            Puerto: 3002 (DEV) | 3003 (PROD)
          </p>
        </div>
      </div>
    </div>
  );
}
