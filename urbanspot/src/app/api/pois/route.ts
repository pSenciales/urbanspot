import { NextResponse } from 'next/server';
import { uploadImageToS3 } from '@/lib/image';
import { v4 as uuidv4 } from 'uuid';
// //============MONGODB=====================
// import dbConnect from '@/lib/mongo';
// import POI from '@/models/POI';
// import mongoose from 'mongoose'; 
// import User from '@/models/User'; 

// ==============MYSQL===================
import { prisma } from '@/lib/prisma';
import { TagEnum } from '@prisma/client';

export async function GET(request: Request) {

  //================================MONGODB============================
  // await dbConnect();
  try {
    const { searchParams } = new URL(request.url);
    const userIdParam = searchParams.get('userId');

    //============================MONGODB==============================
    // let query = {};
    // if (userId && mongoose.Types.ObjectId.isValid(userId)) {
    //   query = { author: new mongoose.Types.ObjectId(userId) };
    // }

    // const pois = await POI.find(query).populate({
    //   path: 'author',
    //   select: 'name image',
    //   model: User
    // });

    // return NextResponse.json(pois);
    
    //=========================MYSQL===================================
    
    // Verificamos que es correcto
    let userId: number | undefined;

    if (userIdParam !== null) {
      const parsed = Number(userIdParam);

      if (Number.isInteger(parsed) && parsed > 0) {
        userId = parsed;
      }
    }

    // Pillamos el Poi junto con el tag y autor
    const pois = await prisma.pOI.findMany({
      where:  {
        authorId: userId
      },
      include: {
        tags: true,
        author: true,
        images: true
      }
    });

    // Tratamos POIs para que tengan el mismo formato que el del frontend. De esta forma, evitamos tocar el frontend con el cambio de la base de datos
    const pois2frontend = pois.map(poi => ({
      _id: poi.id.toString(),
      name: poi.name,
      description: poi.description,
      location: {
        lat: poi.locationLat,
        lng: poi.locationLng
      },
      tags: poi.tags.map(tag => tag.tag.toLowerCase()), 
      author: {
        _id: poi.author.id.toString(),
        name: poi.author.name,
        image: poi.author.image
      },
      ratings: poi.ratings,
      averageRating: poi.averageRating,
      images: poi.images.map(image => 
        ({
          _id: image.id.toString(),
          url: image.url,
          metadata: image.metadata,
          author: image.authorId?.toString(),
          averageRating: image.averageRating

        })
      )
    }));

    return NextResponse.json(pois2frontend);
  } catch (error) {
    console.error('Error fetching POIs:', error);
    return NextResponse.json({ error: 'Error fetching POIs' }, { status: 500 });
  }
}

export async function POST(request: Request) {

  //================================MONGODB============================
  // await dbConnect();
  try {

    const formData = await request.formData();

    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const category = formData.get('category') as string;
    const lat = parseFloat(formData.get('lat') as string);
    const lng = parseFloat(formData.get('lng') as string);
    const authorId = Number(formData.get('authorId'));
    const imageFile = formData.get('image') as File | null;

    //================================MONGODB============================
    // if (!authorId || !mongoose.Types.ObjectId.isValid(authorId)) {
    //   return NextResponse.json({ error: 'Invalid author ID' }, { status: 400 });
    // }

    // let images: { url: string; metadata: Record<string, string>; author: mongoose.Types.ObjectId }[] = [];

    // if (imageFile && imageFile.size > 0) {
    //   const uniqueFileName = `pois/${uuidv4()}-${imageFile.name}`;
    //   const uploadResult = await uploadImageToS3(imageFile, uniqueFileName);
    //   images = [{
    //     url: uploadResult.url,
    //     metadata: uploadResult.metadata,
    //     author: new mongoose.Types.ObjectId(authorId)
    //   }];
    // }

    // const poi = await POI.create({
    //   name,
    //   description,
    //   tags: [category],
    //   location: { lat, lng },
    //   author: new mongoose.Types.ObjectId(authorId),
    //   images,
    // });

    // // Award +20 explorer points and +20 reputation for creating a POI
    // await User.findByIdAndUpdate(authorId, {
    //   $inc: {
    //     'points.explorer': 20,
    //     'reputation': 20
    //      }
    // });

    //==========================MYSQL==================================

    // Comprobamos que es un tipo number
    if (!Number.isInteger(authorId) || authorId <= 0) {
      return NextResponse.json({ error: 'Invalid author ID' }, { status: 400 });
    }

    const images = [];
    // Subimos la imagen al repositorio
    if (imageFile && imageFile.size > 0) {
      const uniqueFileName = `pois/${uuidv4()}-${imageFile.name}`;
      const uploadResult = await uploadImageToS3(imageFile, uniqueFileName);
      // Creamos la imagen
      images.push({ 
        url: uploadResult.url,
        metadata: uploadResult.metadata,
        author:{
          connect: { id: authorId}
        }
      });
    }

    // Comprobamos que la categoría es correcta, aunque siempre lo sea
    if(!category){
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
    }

    // Sólo recibimos una categoria, así que uno únicamente que mapear
    const tagsEnum = {tag: category.toUpperCase() as TagEnum};

    // Creamos POI, la imagen y el tag. 
    const poi = await prisma.pOI.create({
      data:{
        name: name,
        description: description,
        locationLat: lat,
        locationLng: lng,

        // Se crea el objeto imagen y tag a la vez que el poi 
        images: {
          create: images,
        },
        tags: {
          create: tagsEnum
        },

        author: {
          connect: {
            id: authorId
          }
        }
      }
    });

    // Aumentamos la reputacion del usuario
    await prisma.user.update({
      where: { id: authorId },
      data: {
        pointsExplorer: { increment: 20 },
        reputation: { increment: 20 },
      },
    });

    return NextResponse.json(poi, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error creating POI' }, { status: 500 });
  }
}
