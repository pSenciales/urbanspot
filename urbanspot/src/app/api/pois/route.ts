import { NextResponse } from 'next/server';
import { uploadImageToS3 } from '@/lib/image';
import { v4 as uuidv4 } from 'uuid';
// //============MONGODB=====================
// import dbConnect from '@/lib/mongo';
// import POI from '@/models/POI';
// import mongoose from 'mongoose'; <------
// import User from '@/models/User'; <------

// ==============MYSQL===================
import { prisma } from '@/lib/prisma';
import { TagEnum } from '@prisma/client';

//============================VERSION NUEVA DE GET DE MONGO DB==> ADAPTARLO A PRISMA. DEJO AMBAS POR SI ACASO
export async function GET(request: Request) {
  await dbConnect();
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    let query = {};
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      query = { author: new mongoose.Types.ObjectId(userId) };
    }

    const pois = await POI.find(query).populate({
      path: 'author',
      select: 'name image',
      model: User
    });

    return NextResponse.json(pois);
  } catch (error) {
    console.error('Error fetching POIs:', error);
    return NextResponse.json({ error: 'Error fetching POIs' }, { status: 500 });
  }
}

//=========================VERSION A ACTUALIZAR DE GET
export async function GET() {

  //================================MONGODB============================
  // await dbConnect();
  try {
    //const pois = await POI.find({});

    //=========================MYSQL===================================
    const pois = await prisma.pOI.findMany({
      include: {
        tags:true,
        author: true
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
      author: poi.author.name,
      ratings: poi.ratings,
      averageRating: poi.averageRating
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

  //=========================================================================================================NUEVA PARTE AGREGADA. TOCARLA EN LOCAL MEJOR
    const formData = await request.formData();

    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const category = formData.get('category') as string;
    const lat = parseFloat(formData.get('lat') as string);
    const lng = parseFloat(formData.get('lng') as string);
    const authorId = formData.get('authorId') as string;
    const imageFile = formData.get('image') as File | null;

    if (!authorId || !mongoose.Types.ObjectId.isValid(authorId)) {
      return NextResponse.json({ error: 'Invalid author ID' }, { status: 400 });
    }

    let images: { url: string; metadata: Record<string, string>; author: mongoose.Types.ObjectId }[] = [];

    if (imageFile && imageFile.size > 0) {
      const uniqueFileName = `pois/${uuidv4()}-${imageFile.name}`;
      const uploadResult = await uploadImageToS3(imageFile, uniqueFileName);
      images = [{
        url: uploadResult.url,
        metadata: uploadResult.metadata,
        author: new mongoose.Types.ObjectId(authorId)
      }];
    }

    const poi = await POI.create({
      name,
      description,
      tags: [category],
      location: { lat, lng },
      author: new mongoose.Types.ObjectId(authorId),
      images,
    });

    // Award +20 explorer points and +20 reputation for creating a POI
    await User.findByIdAndUpdate(authorId, {
      $inc: {
        'points.explorer': 20,
        'reputation': 20
         }
    });

    //======================================================================================================= COMIENZO DE PARTE ANTIGUA. CAMBIARLA MEJOR EN LOCAL
    const body = await request.json();

    //================================MONGODB============================
    // const poi = await POI.create(body);

    //==========================MYSQL==================================
    // Desglosamos en partes
    const { name, description, tags, location: {lat, lng}, author, images}= body;

    // Transformamos a enums y a su vez a JSON con tags
    const tagsEnum = tags.map((tag: string) => ({tag: tag.toUpperCase() as TagEnum}));

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
            id: author
          }
        }
      }
    });
    //===================================================================================================== ACABA AQUI LO QUE HAY QUE MODIFICAR EN LOCAL
    return NextResponse.json(poi, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error creating POI' }, { status: 500 });
  }
}
