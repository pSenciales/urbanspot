import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import POI from "@/models/POI";
import dbConnect from "@/lib/mongo";
import { uploadImageToS3 } from "@/lib/image";

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get("file") as File;
        const poiId = formData.get("poiId") as string;

        if (!file || !poiId) {
            return NextResponse.json({ error: "No se recibió ningún archivo o id de POI" }, { status: 400 });
        }


        const uniqueFileName = `uploads/${poiId}/${uuidv4()}`;

        const { url, metadata } = await uploadImageToS3(file, uniqueFileName);

        await dbConnect();
        const poi = await POI.findById(poiId);

        poi.images.push({ url, poiId, metadata });
        await poi.save();

        return NextResponse.json({ url, poiId });
    } catch (error) {
        console.error("Error subiendo imagen:", error);

        if (error instanceof Error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({ error: "Error subiendo imagen" }, { status: 500 });
    }
}       