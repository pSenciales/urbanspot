"use client";
import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { signOut } from "next-auth/react";
import { User } from "next-auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function getAvatarSrc(user?: User) {
  if (!user?.image) return "/avatar.jpg";

  if (user.image.startsWith("http")) return user.image;

  if (user.image.startsWith("/")) return user.image;

  return "/avatar.jpg";
}

export function HeaderMenu({ user }: { user?: User }) {
  const avatarSrc = getAvatarSrc(user);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Image
          src={avatarSrc}
          alt={user?.name ?? "Usuario"}
          width={40}
          height={40}
          className="rounded-full border border-blue-500 p-0.5 cursor-pointer"
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/user">👤 Perfil</Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href="/clasificacion">🥇 Clasificación</Link>
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
