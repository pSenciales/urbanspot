import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongo';
import POI from '@/models/POI';
import { uploadImageToS3 } from '@/lib/image';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  await dbConnect();
  try {
    const pois = await POI.find({});
    return NextResponse.json(pois);
  } catch (error) {
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
    const author = formData.get('author') as string;
    const imageFile = formData.get('image') as File | null;

    let images: { url: string; metadata: Record<string, string> }[] = [];

    if (imageFile && imageFile.size > 0) {
      const uniqueFileName = `pois/${uuidv4()}-${imageFile.name}`;
      const uploadResult = await uploadImageToS3(imageFile, uniqueFileName);
      images = [{ url: uploadResult.url, metadata: uploadResult.metadata }];
    }

    const poi = await POI.create({
      name,
      description,
      tags: [category],
      location: { lat, lng },
      author,
      images,
    });

    return NextResponse.json(poi, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error creating POI' }, { status: 500 });
  }
}
