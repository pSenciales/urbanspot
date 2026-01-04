// src/app/components/layout/HeaderMenu.tsx
"use client";
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
import { signOut } from "next-auth/react";
import { User } from "next-auth";
import Image from "next/image";

export function HeaderMenu({ user }: { user?: User }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {user?.image ? (
          <Image 
            src={user.image} 
            alt={user.name || "User"} 
            width={40} 
            height={40} 
            className="rounded-full border border-blue-500 p-1 cursor-pointer" 
          />
        ) : (
          <div className="w-10 h-10 rounded-full border border-blue-500 p-1 cursor-pointer bg-gray-200 flex items-center justify-center text-gray-600 font-semibold">
            {user?.name?.charAt(0).toUpperCase() || "?"}
          </div>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/user">👤 Perfil</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/clasificacion">🥇​ Clasificación</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onClick={() => signOut()}
        >
          ➜] Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}