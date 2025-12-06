// src/app/components/layout/HeaderMenu.tsx

"use client"; // ¡Importante! Esto es un componente de cliente.

import * as React from "react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"; 
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react"; // Icono

// Implementar, signOut para el logout
// import { signOut } from "next-auth/react";

export function HeaderMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="rounded-full p-1">
        <Menu className="h-6 w-6 lg:h-8 lg:w-8" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link href="/perfil">​👤​ Perfil</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/clasificacion">​🥇​ Clasificación</Link>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />

        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          // Implementar: onClick={() => signOut()}
        >
          ➜] Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}