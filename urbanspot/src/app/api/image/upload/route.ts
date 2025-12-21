import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import Image from "@/models/Image";
import dbConnect from "@/lib/mongo";

const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
});

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get("file") as File;
        const poiId = formData.get("poiId") as string;


        if (!file || !poiId) {
            return NextResponse.json({ error: "No se recibió ningún archivo o id de POI" }, { status: 400 });
        }
        if (file.type !== "image/jpeg" && file.type !== "image/png" && file.type !== "image/webp" && file.type !== "image/gif" && file.type !== "image/jpg") {
            return NextResponse.json({ error: "Tipo de archivo no permitido. Solo se aceptan imágenes." }, { status: 400 });
        }

        if (file.size > 4.5 * 1024 * 1024) {
            return NextResponse.json({ error: "El archivo es demasiado grande. El tamaño máximo permitido es de 4.5MB." }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const metadata = {
            poiId,
            name: file.name,
            type: file.type,
            size: file.size.toString(),
            lastModified: file.lastModified.toString(),
            createdAt: new Date().toISOString(),
        };

        const uniqueFileName = `uploads/${poiId}/${uuidv4()}`;

        const command = new PutObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: uniqueFileName,
            Body: buffer,
            ContentType: file.type,
            Metadata: metadata,
        });

        await s3.send(command);

        const finalUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${uniqueFileName}`;


        await dbConnect();
        await Image.create({ url: finalUrl, poiId, metadata });


        return NextResponse.json({ url: finalUrl, poiId });
    } catch (error) {
        console.error("Error subiendo imagen:", error);
        return NextResponse.json({ error: "Error subiendo imagen" }, { status: 500 });
    }
}