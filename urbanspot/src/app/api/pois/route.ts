import { NextResponse } from 'next/server';
// //============MONGODB=====================
// import dbConnect from '@/lib/mongo';
// import POI from '@/models/POI';

// ==============MYSQL===================
import { prisma } from '@/lib/prisma'
import { TagEnum } from '@prisma/client';

export async function GET() {

  //================================MONGODB============================
  // await dbConnect();
  try {
    //const pois = await POI.find({});

    //=========================MYSQL===================================
    const pois = await prisma.pOI.findMany();

    return NextResponse.json(pois);
  } catch (error) {
    return NextResponse.json({ error: 'Error fetching POIs' }, { status: 500 });
  }
}

export async function POST(request: Request) {

  //================================MONGODB============================
  // await dbConnect();
  try {
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

    return NextResponse.json(poi, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error creating POI' }, { status: 500 });
  }
}
