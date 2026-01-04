import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongo';
import POI from '@/models/POI';
import User from '@/models/User';
import { uploadImageToS3 } from '@/lib/image';
import { v4 as uuidv4 } from 'uuid';

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

export async function POST(request: Request) {
  await dbConnect();
  try {
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

    return NextResponse.json(poi, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error creating POI' }, { status: 500 });
  }
}
