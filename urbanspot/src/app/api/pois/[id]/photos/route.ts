import { NextResponse } from 'next/server';
//=================MONGODB======================
// import mongoose from 'mongoose';
// import dbConnect from '@/lib/mongo';
// import POI from '@/models/POI';
// import User from '@/models/User';
//===================MYSQL======================
import { prisma } from '@/lib/prisma';
import { uploadImageToS3 } from '@/lib/image';
import { v4 as uuidv4 } from 'uuid';

// POST: Add a photo to an existing POI
export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    //=======================MONGODB===============================
    // await dbConnect();

    try {
        const { id: poiId } = await params;

        //======================MONGODB===============================================
        // if (!poiId || !mongoose.Types.ObjectId.isValid(poiId)) {
        //     return NextResponse.json({ error: 'Invalid POI ID' }, { status: 400 });
        // }

        //======================MYSSQL==================================000
        const poiId_number = Number(poiId);

        // Comprobamos que es un número válido
        if (!poiId || Number.isNaN(poiId_number)) {
            return NextResponse.json(
                { error: 'Invalid POI ID' },
                { status: 400 }
            );
        }

        const formData = await request.formData();
        const authorId = formData.get('authorId') as string;
        const imageFile = formData.get('image') as File | null;

        //=====================================MONGODB==========================================
        // if (!authorId || !mongoose.Types.ObjectId.isValid(authorId)) {
        //     return NextResponse.json({ error: 'Invalid author ID' }, { status: 400 });
        // }

        //=====================================MYSQL===========================================

        const authorId_number = Number(authorId);

        // Comprobamos que es un número de autor válido
        if (!authorId || Number.isNaN(authorId_number)) {
            return NextResponse.json(
                { error: 'Invalid author ID' },
                { status: 400 }
            );
        }

        if (!imageFile || imageFile.size === 0) {
            return NextResponse.json({ error: 'Image is required' }, { status: 400 });
        }

        //=======================MONGODB==============================================
        // // Check if POI exists
        // const poi = await POI.findById(poiId);
        // if (!poi) {
        //     return NextResponse.json({ error: 'POI not found' }, { status: 404 });
        // }

        //========================MYSQL==============================================
        const poi = await prisma.pOI.findUnique({
            where:{
                id: poiId_number
            }
        });

        if(!poi){
            return NextResponse.json({ error: 'POI not found' }, { status: 404 });
        }

        // Upload image to S3
        const uniqueFileName = `pois/${poiId}/${uuidv4()}-${imageFile.name}`;
        const uploadResult = await uploadImageToS3(imageFile, uniqueFileName);

        //===================================MONGODB============================
        // // Add image to POI
        // const newImage = {
        //     url: uploadResult.url,
        //     metadata: uploadResult.metadata,
        //     author: new mongoose.Types.ObjectId(authorId),
        //     ratings: 0,
        //     averageRating: 0,
        // };

        // poi.images.push(newImage);
        // await poi.save();

        // // Award +5 photographer points and +5 reputation for uploading a photo
        // await User.findByIdAndUpdate(authorId, {
        //     $inc: {
        //         'points.photographer': 5,
        //         'reputation': 5
        //     }
        // });´

        //============================================MYSQL=====================================

        // Comprobamos que existe el autor
        const author = await prisma.user.findUnique({
            where:{
                id: authorId_number
            }
        });

        if(!author){
            return NextResponse.json({ error: 'Author not found' }, { status: 404 });
        }


        // Creamos la imagen que vamos a enviar al frontend
        const newImage = {
            url: uploadResult.url,
            metadata: uploadResult.metadata,
            author: authorId_number,
            ratings: 0,
            averageRatings: 0
        };

        // Creamos la imagen enlazándola al poi
        await prisma.image.create({
        data:{
            url: uploadResult.url,
            metadata: uploadResult.metadata,
            poi:{
                connect: {
                    id: poiId_number
                }
            },
            author:{ 
                connect: { 
                    id: authorId_number 
                } 
            }
        }
        });

        // Aumentamos la reputación del usuario
        await prisma.user.update({
            where: { 
                id: authorId_number 
            },
            data: {
                pointsPhotographer: { increment: 5 },
                reputation: { increment: 5 }
            }
        });

        return NextResponse.json({
            message: 'Photo added successfully',
            image: newImage,
        }, { status: 201 });
    } catch (error) {
        console.error('Error adding photo to POI:', error);
        return NextResponse.json({ error: 'Error adding photo' }, { status: 500 });
    }
}
