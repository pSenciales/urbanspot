import { NextRequest, NextResponse } from "next/server";
import User from "@/models/User";
import dbConnect from "@/lib/mongo";

export async function GET(request: NextRequest) {
    //get all users
    await dbConnect();
    const users = await User.find();
    return NextResponse.json(users);
}

export async function POST(request: NextRequest) {
    const body = await request.json();

    await dbConnect();
    const existingUser = await User.findOne({ email: body.email, provider: body.provider });

    if (existingUser) {
        return NextResponse.json(existingUser);
    }

    const user = await User.create({
        name: body.name,
        email: body.email,
        provider: body.provider
    });

    return NextResponse.json(user);
}

export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, name, image } = body;

        if (!email) {
            return NextResponse.json({ error: "Email es requerido" }, { status: 400 });
        }

        await dbConnect();
        const user = await User.findOne({ email });

        if (!user) {
            return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
        }

        // Update fields
        if (name !== undefined) user.name = name;
        if (image !== undefined) user.image = image;

        await user.save();

        return NextResponse.json(user);
    } catch (error) {
        console.error("Error updating user:", error);
        return NextResponse.json({ error: "Error actualizando usuario" }, { status: 500 });
    }
}
