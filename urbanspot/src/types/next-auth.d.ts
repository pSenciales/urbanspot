// src/types/next-auth.d.ts
import NextAuth, { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
  interface User {
    rol?: "admin" | "user";
    puntos_explorador?: number;
    puntos_fotografo?: number;
  }

  interface Session {
    user: {
      id: string; 
      rol?: "admin" | "user";
      puntos_explorador?: number;
      puntos_fotografo?: number;
    } & DefaultSession["user"]; 
  }
}