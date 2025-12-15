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

