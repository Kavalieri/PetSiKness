import NextAuth from "next-auth";
import { getAuthOptions } from "@/lib/auth-options";
import { NextRequest } from "next/server";

/**
 * Detecta el origen correcto del request para OAuth
 * Prioriza headers del proxy (Apache) sobre otros métodos
 */
function detectOrigin(request: NextRequest): string {
  // Prioridad 1: Headers del proxy (Apache) - CRÍTICO para producción
  let forwardedHost = request.headers.get("x-forwarded-host");
  let forwardedProto = request.headers.get("x-forwarded-proto");

  // Si hay múltiples valores separados por coma (error de configuración), tomar solo el primero
  if (forwardedHost?.includes(",")) {
    forwardedHost = forwardedHost.split(",")[0].trim();
    console.log(
      "[NextAuth] Multiple x-forwarded-host values detected, using first:",
      forwardedHost
    );
  }
  if (forwardedProto?.includes(",")) {
    forwardedProto = forwardedProto.split(",")[0].trim();
  }

  if (forwardedHost && forwardedProto) {
    const origin = `${forwardedProto}://${forwardedHost}`;
    console.log("[NextAuth] Using forwarded headers:", origin);
    return origin;
  }

  // Prioridad 2: Headers directos
  const host = request.headers.get("host");
  if (host) {
    const proto = host.includes("localhost") ? "http" : "https";
    const origin = `${proto}://${host}`;
    console.log("[NextAuth] Using direct headers:", origin);
    return origin;
  }

  // Prioridad 3: URL del request (fallback)
  const origin = request.nextUrl.origin;
  console.log("[NextAuth] Using request URL:", origin);
  return origin;
}

/**
 * Handler dinámico de NextAuth que detecta el dominio automáticamente
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handler(req: NextRequest, context: any) {
  // Detectar origen del request
  const origin = detectOrigin(req);

  // Configurar NEXTAUTH_URL dinámicamente
  process.env.NEXTAUTH_URL = origin;

  // Generar authOptions con la configuración correcta
  const authOptions = getAuthOptions();

  // Ejecutar NextAuth con las opciones dinámicas
  return NextAuth(authOptions)(req, context);
}

export { handler as GET, handler as POST };
