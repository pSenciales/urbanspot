import { NextRequest, NextResponse } from "next/server";
// //=================MONGODB=====================
// import User from "@/models/User";
// import dbConnect from "@/lib/mongo";

//=================MYSQL========================
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
    // //=================MONGODB=====================
    // //get all users
    // await dbConnect();
    // const users = await User.find();

    //=================MYSQL=====================
    //get all users
    const users = await prisma.user.findMany();

    return NextResponse.json(users);
}

export async function POST(request: NextRequest) {
    const body = await request.json();

    // //==================MONGODB=========================
    // await dbConnect();
    // const existingUser = await User.findOne({ email: body.email, provider: body.provider });

    //=================MYSQL=====================

    // Debido a esta búsqueda, no debería de ser emails y providers una clave única?
    const existingUser = await prisma.user.findFirst({
        where: {
            email: body.email,
            provider: body.provider,
        },
    });

    // Como encuentra usuario, devuelve true
    if (existingUser) {
        return NextResponse.json(existingUser);
    }
    
    // //========================MONGODB======================
    // const user = await User.create({
    //     name: body.name,
    //     email: body.email,
    //     provider: body.provider
    // });

    //================MYSQL===============================
    const user = await prisma.user.create({
        data: {
            name: body.name,
            email: body.email,
            provider: body.provider
        },
    });

    return NextResponse.json(user);
}

export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, name, image } = body;

        if (!id) {
            return NextResponse.json({ error: "Id es requerido" }, { status: 400 });
        }

        // //========================MONGODB======================
        // await dbConnect();
        // const user = await User.findOne({ _id: id });

        //======================MYSQL============================
        const user = await prisma.user.findUnique({
            where: {
                id: id
            },
        });

        if (!user) {
            return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
        }

        // //====================MONGODB===========================
        // // Update fields
        // if (name !== undefined) user.name = name;
        // if (image !== undefined) user.image = image;
        // await user.save();

        //====================MYSQL============================

        // Ya sabemos que existe el usuario, así que podemos actualizar sin riesgo a que devuelva error de no encontrado
        await prisma.user.update({
            where: {
                id: id
            },
            data: {
                name: name ?? undefined, // Si name == undefined, toma el undefined. Al ser un undefined explicito el segundo, lo ignora y no actualiza el campo
                image: image ?? undefined
            }
        });

        return NextResponse.json(user);
    } catch (error) {
        console.error("Error updating user:", error);
        return NextResponse.json({ error: "Error actualizando usuario" }, { status: 500 });
    }
}
