import { NextResponse } from 'next/server';
//=============================MONGODB==============
// import dbConnect from '@/lib/mongo';
// import mongoose from 'mongoose';
// import POI from '@/models/POI';
// import User from '@/models/User';
// ========================MYSQL======================
import { prisma } from '@/lib/prisma';
import { uploadImageToS3 } from '@/lib/image';
import { v4 as uuidv4 } from 'uuid';

export async function POST(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  //===========================MONGODB============================
  // await dbConnect();

  try {
    const params = await props.params;
    const { id } = params;
    const formData = await request.formData();
    const authorId = formData.get('authorId') as string;
    const imageFile = formData.get('image') as File | null;

    if (!imageFile || imageFile.size === 0) {
      return NextResponse.json(
        { error: 'No image provided' },
        { status: 400 }
      );
    }

    //=========================MONGODB==============================
    // // Find the POI
    // const poi = await POI.findById(id);
    // if (!poi) {
    //   return NextResponse.json(
    //     { error: 'POI not found' },
    //     { status: 404 }
    //   );
    // }

    //========================MYSQL=============================
    const id_number = Number(id);
    const poi = await prisma.pOI.findUnique({
      where:{
        id: id_number
      }
    });

    if(!poi){
      return NextResponse.json({ error: 'POI not found' }, { status: 404 });
    }

    // Upload image to S3
    const uniqueFileName = `pois/${uuidv4()}-${imageFile.name}`;
    const uploadResult = await uploadImageToS3(imageFile, uniqueFileName);

    //=========================MONGODB==============================
    // // Add image to POI's images array
    // poi.images.push({
    //   url: uploadResult.url,
    //   metadata: uploadResult.metadata,
    //   author: authorId ? new mongoose.Types.ObjectId(authorId) : undefined
    // });

    // await poi.save();

    // // Award +5 photographer points and +5 reputation for uploading a photo
    // if (authorId) {
    //   await User.findByIdAndUpdate(authorId, {
    //     $inc: {
    //       'points.photographer': 5,
    //       'reputation': 5
    //     }
    //   });
    // }

    // ========================MYSQL==================================0

    // Transformamos a tipo Number
    const authorId_number = Number(authorId);

    // Creamos la imagen enlazándola al poi
    await prisma.image.create({
      data:{
        url: uploadResult.url,
        metadata: uploadResult.metadata,
        poi:{
          connect: {
            id: id_number
          }
        },
        author: authorId_number? { connect: { id: authorId_number } } : undefined
      }
    });

    // Aumentamos la reputación del usuario
    if (authorId) {
      await prisma.user.update({
        where: { 
          id: authorId_number 
        },
        data: {
          pointsPhotographer: { increment: 5 },
          reputation: { increment: 5 }
        }
      });
    }


    return NextResponse.json(poi, { status: 200 });
  } catch (error) {
    console.error('Error adding image to POI:', error);
    return NextResponse.json(
      { error: 'Error adding image to POI' },
      { status: 500 }
    );
  }
}