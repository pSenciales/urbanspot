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
      <main className="p-6">
        {children}
      </main>
    </div>
  );
}
