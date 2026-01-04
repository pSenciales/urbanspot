import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongo';
import mongoose from 'mongoose';
import POI from '@/models/POI';
import User from '@/models/User';
import { uploadImageToS3 } from '@/lib/image';
import { v4 as uuidv4 } from 'uuid';

export async function POST(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  await dbConnect();

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

    // Find the POI
    const poi = await POI.findById(id);
    if (!poi) {
      return NextResponse.json(
        { error: 'POI not found' },
        { status: 404 }
      );
    }

    // Upload image to S3
    const uniqueFileName = `pois/${uuidv4()}-${imageFile.name}`;
    const uploadResult = await uploadImageToS3(imageFile, uniqueFileName);

    // Add image to POI's images array
    poi.images.push({
      url: uploadResult.url,
      metadata: uploadResult.metadata,
      author: authorId ? new mongoose.Types.ObjectId(authorId) : undefined
    });

    await poi.save();

    // Award +5 photographer points and +5 reputation for uploading a photo
    if (authorId) {
      await User.findByIdAndUpdate(authorId, {
        $inc: {
          'points.photographer': 5,
          'reputation': 5
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