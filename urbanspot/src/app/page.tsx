// src/app/page.tsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function RootPage() {
  // Obtenemos la sesión del usuario
  const session = await auth();

  // Si no está autenticado -> /login
  if (!session?.user) {
    redirect("/login");
  }

  // Si sí está autenticado -> /home
  redirect("/home");
}
