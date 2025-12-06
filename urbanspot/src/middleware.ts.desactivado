// src/middleware.ts

import { auth } from "./auth";

// 2. Exporta la función 'auth' como el middleware por defecto
export default auth;

// 3. La configuración 'matcher' para excluir /login 
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - login (tu página de login)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|login).*)",
  ],
};