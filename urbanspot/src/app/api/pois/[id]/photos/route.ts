import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongo';
import POI from '@/models/POI';
import User from '@/models/User';
import { uploadImageToS3 } from '@/lib/image';
import { v4 as uuidv4 } from 'uuid';

// POST: Add a photo to an existing POI
export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    await dbConnect();

    try {
        const { id: poiId } = await params;

        if (!poiId || !mongoose.Types.ObjectId.isValid(poiId)) {
            return NextResponse.json({ error: 'Invalid POI ID' }, { status: 400 });
        }

        const formData = await request.formData();
        const authorId = formData.get('authorId') as string;
        const imageFile = formData.get('image') as File | null;

        if (!authorId || !mongoose.Types.ObjectId.isValid(authorId)) {
            return NextResponse.json({ error: 'Invalid author ID' }, { status: 400 });
        }

        if (!imageFile || imageFile.size === 0) {
            return NextResponse.json({ error: 'Image is required' }, { status: 400 });
        }

        // Check if POI exists
        const poi = await POI.findById(poiId);
        if (!poi) {
            return NextResponse.json({ error: 'POI not found' }, { status: 404 });
        }

        // Upload image to S3
        const uniqueFileName = `pois/${poiId}/${uuidv4()}-${imageFile.name}`;
        const uploadResult = await uploadImageToS3(imageFile, uniqueFileName);

        // Add image to POI
        const newImage = {
            url: uploadResult.url,
            metadata: uploadResult.metadata,
            author: new mongoose.Types.ObjectId(authorId),
            ratings: 0,
            averageRating: 0,
        };

        poi.images.push(newImage);
        await poi.save();

        // Award +5 photographer points and +5 reputation for uploading a photo
        await User.findByIdAndUpdate(authorId, {
            $inc: {
                'points.photographer': 5,
                'reputation': 5
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
