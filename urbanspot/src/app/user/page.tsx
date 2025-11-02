"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Image from "next/image";
import Loading from "@/components/loading/Loading";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return <Loading />;
  }

  if (session?.user) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted text-center p-6">
        <Image
          src={session.user.image ?? "/default-avatar.png"}
          alt={session.user.name ?? "Usuario"}
          width={96}
          height={96}
          className="rounded-full border-4 border-blue-500 shadow-lg"
        />
        <h1 className="text-2xl font-semibold text-blue-600">
          ¡Bienvenido, {session.user.name ?? "usuario"}!
        </h1>
        <p className="text-gray-600">
          Has iniciado sesión correctamente con {session.provider}
        </p>
      </div>
    );
  }

  return null;
}
