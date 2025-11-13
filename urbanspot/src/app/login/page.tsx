"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { LoginForm } from "./components/LoginForm";
import Loading from "@/components/loading/Loading";

export default function Login() {
  const { status } = useSession();
  const router = useRouter();

  // Redirección automática si el usuario ya está logueado
  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/home");
    }
  }, [status, router]);

  return (
    <>
    {status === "loading" || status === "authenticated" && <Loading />}
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-4xl">
        <LoginForm />
      </div>
    </div>
    </>
  );
}
