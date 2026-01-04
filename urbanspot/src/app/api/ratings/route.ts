import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongo';
import Rating from '@/models/Rating';
import POI from '@/models/POI';
import User from '@/models/User';

// GET: Check if user has rated an element and get rating info
export async function GET(request: Request) {
    await dbConnect();

    try {
        const { searchParams } = new URL(request.url);
        const targetType = searchParams.get('targetType');
        const targetId = searchParams.get('targetId');
        const userId = searchParams.get('userId');

        if (!targetType || !targetId) {
            return NextResponse.json(
                { error: 'targetType and targetId are required' },
                { status: 400 }
            );
        }

        // If userId is provided, check if user has already rated this element
        let userRating = null;
        if (userId && mongoose.Types.ObjectId.isValid(userId)) {
            userRating = await Rating.findOne({
                user: new mongoose.Types.ObjectId(userId),
                targetType,
                targetId: new mongoose.Types.ObjectId(targetId),
            });
        }

        // Get all ratings for this element to calculate stats
        const ratings = await Rating.find({
            targetType,
            targetId: new mongoose.Types.ObjectId(targetId),
        });

        const totalRatings = ratings.length;
        const averageRating = totalRatings > 0
            ? ratings.reduce((sum, r) => sum + r.score, 0) / totalRatings
            : 0;

        return NextResponse.json({
            totalRatings,
            averageRating: Math.round(averageRating * 10) / 10,
            userRating: userRating ? userRating.score : null,
            hasRated: !!userRating,
        });
    } catch (error) {
        console.error('Error fetching ratings:', error);
        return NextResponse.json({ error: 'Error fetching ratings' }, { status: 500 });
    }
}

// POST: Submit a new rating
export async function POST(request: Request) {
    await dbConnect();

    try {
        const body = await request.json();
        const { userId, targetType, targetId, poiId, score } = body;

        // Validate required fields
        if (!userId || !targetType || !targetId || score === undefined) {
            return NextResponse.json(
                { error: 'userId, targetType, targetId, and score are required' },
                { status: 400 }
            );
        }

        // Validate score range
        if (score < 0 || score > 10) {
            return NextResponse.json(
                { error: 'Score must be between 0 and 10' },
                { status: 400 }
            );
        }

        // Validate ObjectIds
        if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(targetId)) {
            return NextResponse.json(
                { error: 'Invalid userId or targetId' },
                { status: 400 }
            );
        }

        // Get the target element to check ownership
        let authorId: string | null = null;

        if (targetType === 'POI') {
            const poi = await POI.findById(targetId);
            if (!poi) {
                return NextResponse.json({ error: 'POI not found' }, { status: 404 });
            }
            authorId = poi.author.toString();
        } else if (targetType === 'Image') {
            // For images, we need to find the POI containing this image
            const poi = await POI.findOne({ 'images._id': new mongoose.Types.ObjectId(targetId) });
            if (!poi) {
                return NextResponse.json({ error: 'Image not found' }, { status: 404 });
            }
            const image = poi.images.find((img: { _id: mongoose.Types.ObjectId }) => img._id.toString() === targetId);
            authorId = image?.author?.toString() || poi.author.toString();
        }

        // Check if user is trying to rate their own content
        if (authorId === userId) {
            return NextResponse.json(
                { error: 'Cannot rate your own content' },
                { status: 403 }
            );
        }

        // Check if user has already rated this element
        const existingRating = await Rating.findOne({
            user: new mongoose.Types.ObjectId(userId),
            targetType,
            targetId: new mongoose.Types.ObjectId(targetId),
        });

        if (existingRating) {
            return NextResponse.json(
                { error: 'You have already rated this element' },
                { status: 400 }
            );
        }

        // Create the rating
        const rating = await Rating.create({
            user: new mongoose.Types.ObjectId(userId),
            targetType,
            targetId: new mongoose.Types.ObjectId(targetId),
            poiId: poiId ? new mongoose.Types.ObjectId(poiId) : undefined,
            score,
        });

        // Calculate new average rating
        const allRatings = await Rating.find({
            targetType,
            targetId: new mongoose.Types.ObjectId(targetId),
        });

        const totalRatings = allRatings.length;
        const averageRating = allRatings.reduce((sum, r) => sum + r.score, 0) / totalRatings;
        const roundedAverage = Math.round(averageRating * 10) / 10;

        // Update the target element with new rating stats
        if (targetType === 'POI') {
            const previousPoi = await POI.findById(targetId);
            const previousAverage = previousPoi?.averageRating || 0;

            await POI.findByIdAndUpdate(targetId, {
                ratings: totalRatings,
                averageRating: roundedAverage,
            });

            // Award +10 reputation points to author if average went above 7
            if (authorId && previousAverage <= 7 && roundedAverage > 7) {
                await User.findByIdAndUpdate(authorId, {
                    $inc: { reputation: 10 }
                });
            }
        } else if (targetType === 'Image') {
            // Update the image within the POI
            const poi = await POI.findOne({ 'images._id': new mongoose.Types.ObjectId(targetId) });
            if (poi) {
                const imageIndex = poi.images.findIndex(
                    (img: { _id: mongoose.Types.ObjectId }) => img._id.toString() === targetId
                );
                if (imageIndex !== -1) {
                    const previousAverage = poi.images[imageIndex].averageRating || 0;

                    poi.images[imageIndex].ratings = totalRatings;
                    poi.images[imageIndex].averageRating = roundedAverage;
                    await poi.save();

                    // Award +10 reputation points to author if average went above 7
                    if (authorId && previousAverage <= 7 && roundedAverage > 7) {
                        await User.findByIdAndUpdate(authorId, {
                            $inc: { reputation: 10 }
                        });
                    }
                }
            }
        }

        // Award +1 reputation point to the voter for rating content
        await User.findByIdAndUpdate(userId, {
            $inc: { reputation: 1 }
        });

        return NextResponse.json({
            rating,
            totalRatings,
            averageRating: roundedAverage,
        }, { status: 201 });
    } catch (error) {
        console.error('Error creating rating:', error);
        if ((error as { code?: number }).code === 11000) {
            return NextResponse.json(
                { error: 'You have already rated this element' },
                { status: 400 }
            );
        }
        return NextResponse.json({ error: 'Error creating rating' }, { status: 500 });
    }
}

// PUT: Update an existing rating
export async function PUT(request: Request) {
    await dbConnect();

    try {
        const body = await request.json();
        const { userId, targetType, targetId, score } = body;

        // Validate required fields
        if (!userId || !targetType || !targetId || score === undefined) {
            return NextResponse.json(
                { error: 'userId, targetType, targetId, and score are required' },
                { status: 400 }
            );
        }

        // Validate score range
        if (score < 0 || score > 10) {
            return NextResponse.json(
                { error: 'Score must be between 0 and 10' },
                { status: 400 }
            );
        }

        // Find and update the existing rating
        const existingRating = await Rating.findOne({
            user: new mongoose.Types.ObjectId(userId),
            targetType,
            targetId: new mongoose.Types.ObjectId(targetId),
        });

        if (!existingRating) {
            return NextResponse.json(
                { error: 'Rating not found' },
                { status: 404 }
            );
        }

        // Update the rating
        existingRating.score = score;
        await existingRating.save();

        // Get author for bonus point calculation
        let authorId: string | null = null;
        if (targetType === 'POI') {
            const poi = await POI.findById(targetId);
            authorId = poi?.author.toString() || null;
        } else if (targetType === 'Image') {
            const poi = await POI.findOne({ 'images._id': new mongoose.Types.ObjectId(targetId) });
            if (poi) {
                const image = poi.images.find((img: { _id: mongoose.Types.ObjectId }) => img._id.toString() === targetId);
                authorId = image?.author?.toString() || poi.author.toString();
            }
        }

        // Recalculate average rating
        const allRatings = await Rating.find({
            targetType,
            targetId: new mongoose.Types.ObjectId(targetId),
        });

        const totalRatings = allRatings.length;
        const averageRating = allRatings.reduce((sum, r) => sum + r.score, 0) / totalRatings;
        const roundedAverage = Math.round(averageRating * 10) / 10;

        // Update the target element with new rating stats
        if (targetType === 'POI') {
            const previousPoi = await POI.findById(targetId);
            const previousAverage = previousPoi?.averageRating || 0;

            await POI.findByIdAndUpdate(targetId, {
                ratings: totalRatings,
                averageRating: roundedAverage,
            });

            // Award +10 reputation points to author if average crossed above 7
            if (authorId && previousAverage <= 7 && roundedAverage > 7) {
                await User.findByIdAndUpdate(authorId, {
                    $inc: { reputation: 10 }
                });
            }
        } else if (targetType === 'Image') {
            const poi = await POI.findOne({ 'images._id': new mongoose.Types.ObjectId(targetId) });
            if (poi) {
                const imageIndex = poi.images.findIndex(
                    (img: { _id: mongoose.Types.ObjectId }) => img._id.toString() === targetId
                );
                if (imageIndex !== -1) {
                    const previousAverage = poi.images[imageIndex].averageRating || 0;

                    poi.images[imageIndex].ratings = totalRatings;
                    poi.images[imageIndex].averageRating = roundedAverage;
                    await poi.save();

                    // Award +10 reputation points to author if average crossed above 7
                    if (authorId && previousAverage <= 7 && roundedAverage > 7) {
                        await User.findByIdAndUpdate(authorId, {
                            $inc: { reputation: 10 }
                        });
                    }
                }
            }
        }

        return NextResponse.json({
            rating: existingRating,
            totalRatings,
            averageRating: roundedAverage,
        });
    } catch (error) {
        console.error('Error updating rating:', error);
        return NextResponse.json({ error: 'Error updating rating' }, { status: 500 });
    }
}
