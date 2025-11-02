"use client"
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

export default function UserLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <nav className="bg-white shadow-md px-6 py-4 flex justify-end items-center">
        <Button
          onClick={() => signOut({redirect: true, redirectTo: "/login"})}
          className="bg-red-500 text-white hover:bg-red-600 transition-colors"
        >
          Cerrar sesión
        </Button>
      </nav>
      <main className="p-6">
        {children}
      </main>
    </div>
  );
}
