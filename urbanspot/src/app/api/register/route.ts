// src/app/api/register/route.ts

import clientPromise from "@/lib/mongodb"; 
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { message: "Faltan campos obligatorios" },
        { status: 400 }
      );
    }

    // Conectar a la BD
    const client = await clientPromise;
    const db = client.db("UrbanSpotDB"); 
    const usersCollection = db.collection("users");

    // Comprobar si el email ya existe
    const existingUser = await usersCollection.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { message: "El email ya está en uso" },
        { status: 409 } 
      );
    }

    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear el nuevo usuario
    const result = await usersCollection.insertOne({
      name,
      email,
      password: hashedPassword,
      image: null, 
      emailVerified: null, 
      rol: "user",
      puntos_explorador: 0,
      puntos_fotografo: 0,
    });

    return NextResponse.json(
      { message: "Usuario creado con éxito", userId: result.insertedId },
      { status: 201 } 
    );

  } catch (error) {
    console.error("Error en el registro:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}