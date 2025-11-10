import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Rutas que requieren autenticación
const protectedRoutes = ["/pets", "/foods", "/feeding", "/onboarding"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Obtener token de sesión
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Si no está autenticado y intenta acceder a ruta protegida
  if (!token && isProtectedRoute) {
    const url = new URL("/login", request.url);
    return NextResponse.redirect(url);
  }

  // Si está autenticado y NO está en onboarding
  if (token && pathname !== "/onboarding") {
    // Verificar si tiene household_id en token (se añade en callback de session)
    // Por ahora, permitimos el acceso - la validación la hace cada página
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api/auth/* (NextAuth routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc)
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\..*|_next).*)",
  ],
};
