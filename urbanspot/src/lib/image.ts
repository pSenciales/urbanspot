import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
});

export interface UploadImageResult {
    url: string;
    metadata: {
        name: string;
        type: string;
        size: string;
        lastModified: string;
        createdAt: string;
    };
}

export async function uploadImageToS3(file: File, uniqueFileName: string): Promise<UploadImageResult> {
    if (file.type !== "image/jpeg" && file.type !== "image/png" && file.type !== "image/webp" && file.type !== "image/gif" && file.type !== "image/jpg") {
        throw new Error("Tipo de archivo no permitido. Solo se aceptan imágenes.");
    }

    if (file.size > 4.5 * 1024 * 1024) {
        throw new Error("El archivo es demasiado grande. El tamaño máximo permitido es de 4.5MB.");
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const metadata = {
        name: file.name,
        type: file.type,
        size: file.size.toString(),
        lastModified: file.lastModified.toString(),
        createdAt: new Date().toISOString(),
    };

    const command = new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: uniqueFileName,
        Body: buffer,
        ContentType: file.type,
        Metadata: metadata,
    });

    await s3.send(command);

    const url = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${uniqueFileName}`;

    return {
        url,
        metadata,
    };
}
