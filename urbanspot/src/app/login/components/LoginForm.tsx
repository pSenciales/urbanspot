"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldSeparator,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { signIn } from "next-auth/react"
import Image from "next/image"

export function LoginForm({ className, ...props }: React.ComponentProps<"div">) {
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (isRegister) {
      try {
        const res = await fetch('/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password }),
        });

        if (res.status === 201) {
          const signInRes = await signIn("credentials", {
            email,
            password,
            redirect: false,
          });
          if (signInRes?.ok) router.push("/home");
          else setError("No se pudo iniciar sesión tras registrarse");
        } else {
          const data = await res.json();
          setError(data.message || "Error desconocido al registrarse");
        }
      } catch {
        setError("Error de conexión");
      }
    } else {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (res?.ok) router.push("/home");
      else setError("Email o contraseña incorrectos");
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-6 md:p-8" onSubmit={handleSubmit}>
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">{isRegister ? "Crea una cuenta" : "Bienvenido"}</h1>
                <p className="text-muted-foreground text-balance">
                  {isRegister ? "Rellena tus datos para unirte" : "Inicia sesión en UrbanSpot"}
                </p>
              </div>

              {/* Campos del formulario */}
              <div className="grid gap-4">
                {isRegister && (
                  <Field>
                    <Label htmlFor="name">Nombre</Label>
                    <Input id="name" type="text" value={name} onChange={e => setName(e.target.value)} required />
                  </Field>
                )}

                <Field>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
                </Field>

                <Field>
                  <Label htmlFor="password">Contraseña</Label>
                  <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
                </Field>

                {error && <p className="text-sm text-destructive text-center">{error}</p>}

                <Button type="submit" className="w-full">
                  {isRegister ? "Registrarse" : "Iniciar Sesión"}
                </Button>
              </div>

              <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
                O continúa con
              </FieldSeparator>

              <Field className="grid gap-4">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => signIn("google")}
                  className="flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="h-5 w-5">
                    <path fill="#EA4335" d="M24 9.5c3.94 0 6.6 1.7 8.1 3.1l5.9-5.9C34.3 3.2 29.7 1 24 1 14.8 1 7.1 6.8 4.3 14.8l7 5.4C12.8 14.4 17.9 9.5 24 9.5z" />
                    <path fill="#34A853" d="M24 44c5.7 0 10.4-1.9 13.9-5.2l-6.4-5.2c-1.8 1.2-4.1 2-7.5 2-5.8 0-10.8-3.9-12.6-9.1l-7 5.4C7.1 40.9 14.8 44 24 44z" />
                    <path fill="#4A90E2" d="M44.5 24c0-1.5-.1-2.9-.3-4.3H24v8.1h11.6c-.5 2.7-1.9 5.1-4.1 6.8l6.4 5.2C41.6 36.6 44.5 30.9 44.5 24z" />
                    <path fill="#FBBC05" d="M11.4 26.5c-.4-1.2-.6-2.4-.6-3.5s.2-2.3.6-3.5l-7-5.4C3.5 17.1 3 20.5 3 23s.5 5.9 1.4 8.9l7-5.4z" />
                  </svg>
                  Iniciar sesión con Google
                </Button>

                <Button
                  variant="outline"
                  type="button"
                  onClick={() => signIn("github")}
                  className="flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path d="M12 .5C5.65.5.5 5.65.5 12a11.5 11.5 0 007.86 10.93c.58.1.79-.25.79-.55v-1.92c-3.2.7-3.88-1.54-3.88-1.54-.53-1.33-1.3-1.68-1.3-1.68-1.06-.73.08-.72.08-.72 1.17.08 1.78 1.22 1.78 1.22 1.04 1.77 2.73 1.26 3.4.97.1-.76.41-1.27.75-1.56-2.55-.29-5.23-1.27-5.23-5.64 0-1.25.44-2.26 1.17-3.05-.12-.29-.51-1.46.11-3.04 0 0 .96-.31 3.15 1.16a10.9 10.9 0 015.73 0c2.19-1.47 3.15-1.16 3.15-1.16.62 1.58.23 2.75.12 3.04.73.79 1.16 1.8 1.16 3.05 0 4.39-2.69 5.35-5.26 5.63.42.36.8 1.08.8 2.19v3.25c0 .3.21.65.8.54A11.51 11.51 0 0023.5 12C23.5 5.65 18.35.5 12 .5z" />
                  </svg>
                  Iniciar sesión con GitHub
                </Button>
                {/*
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => signIn("twitter")}
                  className="flex items-center justify-center gap-2"
                >
                  <Image
                    src="/x-logo-black.png"
                    alt="X logo"
                    className="h-3 w-3"
                    width={20}
                    height={20}
                  />
                  Iniciar sesión con X
                </Button>*/}
              </Field>

              <FieldDescription className="text-center">
                {isRegister ? "¿Ya tienes cuenta?" : "¿No tienes una cuenta?"}{" "}
                <Button
                  variant="link"
                  type="button"
                  onClick={() => { setIsRegister(!isRegister); setError(""); }}
                  className="p-0 h-auto"
                >
                  {isRegister ? "Inicia sesión" : "Regístrate"}
                </Button>
              </FieldDescription>
            </FieldGroup>
          </form>

          <div className="bg-[#191e21] hidden md:flex items-center justify-center">
            <Image
              src="/logo_bg.png"
              alt="Logo UrbanSpot"
              width={150}
              height={150}
              className="mx-auto"
            />
          </div>
        </CardContent>
      </Card>

      <FieldDescription className="px-6 text-center">
        Al iniciar sesión, aceptas nuestros <a href="#">Términos de Servicio</a>{" "}
        y <a href="#">Política de Privacidad</a>.
      </FieldDescription>
    </div>
  )
}
