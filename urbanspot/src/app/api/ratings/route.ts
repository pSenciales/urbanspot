import { NextResponse } from 'next/server';
//=================MONGODB=========================
// import mongoose from 'mongoose';
// import dbConnect from '@/lib/mongo';
// import Rating from '@/models/Rating';
// import POI from '@/models/POI';
// import User from '@/models/User';

//===============MYSQL==============================
import { prisma } from '@/lib/prisma';

// GET: Check if user has rated an element and get rating info
export async function GET(request: Request) {
    //================MONGODB=========================
    // await dbConnect();

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

        //================================MONGODB================================
        // If userId is provided, check if user has already rated this element
        // let userRating = null;
        // if (userId && mongoose.Types.ObjectId.isValid(userId)) {
        //     userRating = await Rating.findOne({
        //         user: new mongoose.Types.ObjectId(userId),
        //         targetType,
        //         targetId: new mongoose.Types.ObjectId(targetId),
        //     });
        // }

        //========================MYSQL=========================
        // Pasamos a number y luego se comprueba si es válido
        const authorId_number = Number(userId);

        // Comprobamos si poi válido 
        const id_number = Number(targetId)

        if(Number.isNaN(id_number)){
            return NextResponse.json(
                { error: 'targetId is not a number' },
                { status: 400 }
            );
        }


        // Comprobamos que es un número de autor válido. Si lo es, comprobamos si ya lo ha valorado
        let authorRating = null;
        if (userId || !Number.isNaN(authorId_number)) {
            if(targetType === 'POI'){
                authorRating = await prisma.ratingPoi.findUnique({
                    where:{
                        poiId_authorId:{
                            poiId: id_number,
                            authorId: authorId_number
                        }
                    }
                })
            }else{
                authorRating = await prisma.ratingImage.findUnique({
                    where:{
                        imageId_authorId: {
                            imageId: id_number,
                            authorId: authorId_number
                        }
                    }
                })
            }
        }

        //=============================MONGODB======================
        // // Get all ratings for this element to calculate stats
        // const ratings = await Rating.find({
        //     targetType,
        //     targetId: new mongoose.Types.ObjectId(targetId),
        // });

        // const totalRatings = ratings.length;
        // const averageRating = totalRatings > 0
        //     ? ratings.reduce((sum, r) => sum + r.score, 0) / totalRatings
        //     : 0;

        //===============================MYSQL=======================
        // Conseguimos todos los ratings de ese elemento
        let stats;

        if (targetType === 'POI') {
            stats = await prisma.ratingPoi.aggregate({
                where: { poiId: id_number },
                _count: { score: true },
                _avg: { score: true },
            });
        } else {
            stats = await prisma.ratingImage.aggregate({
                where: { imageId: id_number },
                _count: { score: true },
                _avg: { score: true },
            });
        }

        const totalRatings = stats._count.score;
        const averageRating = stats._avg.score ?? 0;

        return NextResponse.json({
            totalRatings,
            averageRating: Math.round(averageRating * 10) / 10,
            userRating: authorRating ? authorRating.score : null,
            hasRated: !!authorRating,
        });
    } catch (error) {
        console.error('Error fetching ratings:', error);
        return NextResponse.json({ error: 'Error fetching ratings' }, { status: 500 });
    }
}

// POST: Submit a new rating
export async function POST(request: Request) {
    //===================MONGODB=========================
    // await dbConnect();

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

        //=================================MONGODB===============================================
        // Validate ObjectIds
        // if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(targetId)) {
        //     return NextResponse.json(
        //         { error: 'Invalid userId or targetId' },
        //         { status: 400 }
        //     );
        // }

        //===========================MYSQL=====================
        const authorId_number = Number(userId);
        const id_number = Number(targetId);

        // Validate ids
        if(Number.isNaN(id_number) || Number.isNaN(authorId_number)){
            return NextResponse.json(
                { error: 'Invalid userId or targetId' },
                { status: 400 }
            );
        }

        //=====================================MONGODB==================================================================0
        // // Get the target element to check ownership
        // let authorId_target: string | null = null;

        // if (targetType === 'POI') {
        //     const poi = await POI.findById(targetId);
        //     if (!poi) {
        //         return NextResponse.json({ error: 'POI not found' }, { status: 404 });
        //     }
        //     authorId = poi.author.toString();
        // } else if (targetType === 'Image') {
        //     // For images, we need to find the POI containing this image
        //     const poi = await POI.findOne({ 'images._id': new mongoose.Types.ObjectId(targetId) });
        //     if (!poi) {
        //         return NextResponse.json({ error: 'Image not found' }, { status: 404 });
        //     }
        //     const image = poi.images.find((img: { _id: mongoose.Types.ObjectId }) => img._id.toString() === targetId);
        //     authorId = image?.author?.toString() || poi.author.toString();
        // }

        //================================MYSQL===============================================
        let authorId_target: number | null = null;

        // Obtenemos el autor original del objeto
        if(targetType === 'POI'){
            const poi = await prisma.pOI.findUnique({
                where:{
                    id: id_number
                },
                select:{
                    authorId: true
                }
            });

            if(!poi){
                return NextResponse.json({ error: 'POI not found' }, { status: 404 });
            }

            authorId_target = poi.authorId;
        }else if (targetType === 'Image'){
            const image = await prisma.image.findUnique({
                where:{
                    id: id_number
                },
                select: {
                    authorId: true,
                    poi: { select: { authorId: true } },
                },
            });

            if(!image){
                return NextResponse.json({ error: 'Image not found' }, { status: 404 });
            }
            
            // Si la imagen no tiene autor, usamos el del POI
            authorId_target = image.authorId ?? image.poi.authorId;
        }

        //=========================MONGODB, PERO PORQUE HEMOS CAMBIADO EL NOMBRE A ALGUNAS VARIABLES======================
        // // Check if user is trying to rate their own content
        // if (authorId === userId) {
        //     return NextResponse.json(
        //         { error: 'Cannot rate your own content' },
        //         { status: 403 }
        //     );
        // }

        //====================MYSQL=================================
        // Check if user is trying to rate their own content
        if (authorId_target === authorId_number) {
            return NextResponse.json(
                { error: 'Cannot rate your own content' },
                { status: 403 }
            );
        }

        //========================MONGODB=========================
        // // Check if user has already rated this element
        // const existingRating = await Rating.findOne({
        //     user: new mongoose.Types.ObjectId(userId),
        //     targetType,
        //     targetId: new mongoose.Types.ObjectId(targetId),
        // });

        //=========================MYSQL==========================
        // Comprobamos si ya se habia valorado
        let existingRating = null;

        if(targetType === 'POI'){
            existingRating = await prisma.ratingPoi.findUnique({
                where:{
                    poiId_authorId:{
                        poiId: id_number,
                        authorId: authorId_number
                    }
                }
            });
        }else if(targetType === 'Image'){
            existingRating = await prisma.ratingImage.findUnique({
                where:{
                    imageId_authorId:{
                        imageId: id_number,
                        authorId: authorId_number
                    }
                }
            });
        }

        if (existingRating) {
            return NextResponse.json(
                { error: 'You have already rated this element' },
                { status: 400 }
            );
        }

        
        //====================0MONGODB==========================
        // // Create the rating
        // const rating = await Rating.create({
        //     user: new mongoose.Types.ObjectId(userId),
        //     targetType,
        //     targetId: new mongoose.Types.ObjectId(targetId),
        //     poiId: poiId ? new mongoose.Types.ObjectId(poiId) : undefined,
        //     score,
        // });

        //========================MYSQL======================
        // Create the rating
        let rating;
        if(targetType === 'POI'){
            rating = await prisma.ratingPoi.create({
                data:{
                    score: score,
                    poiId: id_number,
                    authorId: authorId_number
                }
            })
        }else if(targetType === 'Image'){
            rating = await prisma.ratingImage.create({
                data:{
                    score: score,
                    imageId: id_number,
                    authorId: authorId_number
                }
            })
        }

        //=================MONGODB==================
        // // Calculate new average rating
        // const allRatings = await Rating.find({
        //     targetType,
        //     targetId: new mongoose.Types.ObjectId(targetId),
        // });

        // const totalRatings = allRatings.length;
        // const averageRating = allRatings.reduce((sum, r) => sum + r.score, 0) / totalRatings;
        // const roundedAverage = Math.round(averageRating * 10) / 10;

        //=====================MYSQL====================
        // Calculamos la media y el total mediante agregacion
        let stats;

        if (targetType === 'POI') {
            stats = await prisma.ratingPoi.aggregate({
                where: { poiId: id_number },
                _count: { score: true },
                _avg: { score: true },
            });
        } else {
            stats = await prisma.ratingImage.aggregate({
                where: { imageId: id_number },
                _count: { score: true },
                _avg: { score: true },
            });
        }

        const totalRatings = stats._count.score;
        const averageRating = stats._avg.score ?? 0;
        const roundedAverage = Math.round(averageRating * 10) / 10;


        // Update the target element with new rating stats
        if (targetType === 'POI') {
            //=========================MONGODB================================
            // const previousPoi = await POI.findById(targetId);
            // const previousAverage = previousPoi?.averageRating || 0;

            // await POI.findByIdAndUpdate(targetId, {
            //     ratings: totalRatings,
            //     averageRating: roundedAverage,
            // });

            // // Award +10 reputation points to author if average went above 7
            // if (authorId && previousAverage <= 7 && roundedAverage > 7) {
            //     await User.findByIdAndUpdate(authorId, {
            //         $inc: { reputation: 10 }
            //     });
            // }

            //=======================MYSQL===================================
            const previousPoi = await prisma.pOI.findUnique({
                where: { id: id_number },
                select: { averageRating: true },
            });

            const previousAverage = previousPoi?.averageRating ?? 0;

            await prisma.pOI.update({
                where: { id: id_number },
                data: {
                ratings: totalRatings,
                averageRating: roundedAverage,
                },
            });

            // Si el autor del POI objetivo esta incluido y la reputacion del poi es superior a 7, recibe buntos
            if (authorId_target && previousAverage <= 7 && roundedAverage > 7) {
                await prisma.user.update({
                    where: { id: authorId_target },
                    data: {
                        reputation: { increment: 10 },
                    },
                });
            }

        } else if (targetType === 'Image') {
            //===========================MONGODB====================================================
            // // Update the image within the POI
            // const poi = await POI.findOne({ 'images._id': new mongoose.Types.ObjectId(targetId) });
            // if (poi) {
            //     const imageIndex = poi.images.findIndex(
            //         (img: { _id: mongoose.Types.ObjectId }) => img._id.toString() === targetId
            //     );
            //     if (imageIndex !== -1) {
            //         const previousAverage = poi.images[imageIndex].averageRating || 0;

            //         poi.images[imageIndex].ratings = totalRatings;
            //         poi.images[imageIndex].averageRating = roundedAverage;
            //         await poi.save();

            //         // Award +10 reputation points to author if average went above 7
            //         if (authorId && previousAverage <= 7 && roundedAverage > 7) {
            //             await User.findByIdAndUpdate(authorId, {
            //                 $inc: { reputation: 10 }
            //             });
            //         }
            //     }
            // }

            //=============================MYSQL=====================================
            // Buscamos la media anterior de la imagen
            const previousImage = await prisma.image.findUnique({
                where: { id: id_number },
                select: { averageRating: true },
            });

            const previousAverage = previousImage?.averageRating ?? 0;

            // Actualizamos la imagen con el nuevo rating y average
            await prisma.image.update({
                where: { id: id_number },
                data: {
                    ratings: totalRatings,
                    averageRating: roundedAverage,
                },
            });

            // Si existe el autor de la imagen y la puntuación de la imagen es superior a 7, gana 10 puntos
            if (authorId_target && previousAverage <= 7 && roundedAverage > 7) {
                await prisma.user.update({
                    where: { id: authorId_target },
                    data: {
                        reputation: { increment: 10 },
                    },
                });
            }
        }

        //================================MONGODB===============================
        // // Award +1 reputation point to the voter for rating content
        // await User.findByIdAndUpdate(userId, {
        //     $inc: { reputation: 1 }
        // });

        //===================================MYSQL============================
        // Recompensamos con un punto al votante
        await prisma.user.update({
            where: { id: authorId_number },
            data: {
                reputation: { increment: 1 },
            },
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
    //======================MONGODB======================
    // await dbConnect();

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

        //=============================MONGODB================================
        // // Find and update the existing rating
        // const existingRating = await Rating.findOne({
        //     user: new mongoose.Types.ObjectId(userId),
        //     targetType,
        //     targetId: new mongoose.Types.ObjectId(targetId),
        // });

        //=============================MYSQL====================================
        // Verificamos que el id del usuario y el id del objetivo es un number
        const authorId_number = Number(userId);
        const id_number = Number(targetId);

        if(Number.isNaN(id_number) || Number.isNaN(authorId_number)){
            return NextResponse.json(
                { error: 'Invalid userId or targetId' },
                { status: 400 }
            );
        }

        // Encontramos rating existente según el objetivo
        let existingRating;
        if( targetType === 'POI'){
            existingRating = await prisma.ratingPoi.findUnique({
                where: {
                    poiId_authorId: {
                        poiId: id_number,
                        authorId: authorId_number,
                    },
                },
            });
        }else{
            existingRating = await prisma.ratingImage.findUnique({
                where: {
                    imageId_authorId: {
                        imageId: id_number,
                        authorId: authorId_number,
                    },
                },
            });
        }
        
        if (!existingRating) {
            return NextResponse.json(
                { error: 'Rating not found' },
                { status: 404 }
            );
        }
        
        //=======================MONGODB=======================
        // // Update the rating
        // existingRating.score = score;
        // await existingRating.save();

        //========================MYSQL========================
        // Actualizamos el rating según el tipo original
        if(targetType === 'POI'){
            await prisma.ratingPoi.update({
                where: {
                    poiId_authorId: {
                        poiId: id_number,
                        authorId: authorId_number,
                    },
                },
                data: { 
                    score: score
                },
            });
        }else{
            await prisma.ratingImage.update({
                where: {
                    imageId_authorId: {
                        imageId: id_number,
                        authorId: authorId_number,
                    },
                },
                data: { 
                    score: score
                },
            });
        }


        //=======================MONGODB=====================================
        // // Get author for bonus point calculation
        // let authorId: string | null = null;
        // if (targetType === 'POI') {
        //     const poi = await POI.findById(targetId);
        //     authorId = poi?.author.toString() || null;
        // } else if (targetType === 'Image') {
        //     const poi = await POI.findOne({ 'images._id': new mongoose.Types.ObjectId(targetId) });
        //     if (poi) {
        //         const image = poi.images.find((img: { _id: mongoose.Types.ObjectId }) => img._id.toString() === targetId);
        //         authorId = image?.author?.toString() || poi.author.toString();
        //     }
        // }

        //==========================MYSQL======================================
        // Obtener al autor original del target
        let authorId_target: number | null = null;

        // Obtenemos el autor original del objeto
        if(targetType === 'POI'){
            const poi = await prisma.pOI.findUnique({
                where:{
                    id: id_number
                },
                select:{
                    authorId: true
                }
            });

            if(!poi){
                return NextResponse.json({ error: 'POI not found' }, { status: 404 });
            }

            authorId_target = poi.authorId;
        }else if (targetType === 'Image'){
            const image = await prisma.image.findUnique({
                where:{
                    id: id_number
                },
                select: {
                    authorId: true,
                    poi: { select: { authorId: true } },
                },
            });

            if(!image){
                return NextResponse.json({ error: 'Image not found' }, { status: 404 });
            }
            
            // Si la imagen no tiene autor, usamos el del POI
            authorId_target = image.authorId ?? image.poi.authorId;
        }
        

        //=========================MONGODB=====================================================
        // // Recalculate average rating
        // const allRatings = await Rating.find({
        //     targetType,
        //     targetId: new mongoose.Types.ObjectId(targetId),
        // });

        // const totalRatings = allRatings.length;
        // const averageRating = allRatings.reduce((sum, r) => sum + r.score, 0) / totalRatings;
        // const roundedAverage = Math.round(averageRating * 10) / 10;

        //=====================MYSQL===================================
        // Recalculamos la media de puntaje mediante una agregación
        let stats;

        if (targetType === 'POI') {
            stats = await prisma.ratingPoi.aggregate({
                where: { poiId: id_number },
                _count: { score: true },
                _avg: { score: true },
            });
        } else {
            stats = await prisma.ratingImage.aggregate({
                where: { imageId: id_number },
                _count: { score: true },
                _avg: { score: true },
            });
        }

        const totalRatings = stats._count.score;
        const averageRating = stats._avg.score ?? 0;
        const roundedAverage = Math.round(averageRating * 10) / 10;

        // Update the target element with new rating stats
        if (targetType === 'POI') {
            //========================================MONGODB======================================
            // const previousPoi = await POI.findById(targetId);
            // const previousAverage = previousPoi?.averageRating || 0;

            // await POI.findByIdAndUpdate(targetId, {
            //     ratings: totalRatings,
            //     averageRating: roundedAverage,
            // });

            // // Award +10 reputation points to author if average crossed above 7
            // if (authorId && previousAverage <= 7 && roundedAverage > 7) {
            //     await User.findByIdAndUpdate(authorId, {
            //         $inc: { reputation: 10 }
            //     });
            // }

            //=============================MYSQL=========================
            // Tomamos el poi antiguo
            const previous = await prisma.pOI.findUnique({
                where: { id: id_number },
                select: { averageRating: true },
            });

            const previousAverage = previous?.averageRating ?? 0;
            
            // Actualizamos la valoración del poi
            await prisma.pOI.update({
                where: { id: id_number },
                data: {
                    ratings: totalRatings,
                    averageRating: roundedAverage,
                },
            });

            // Recompensamos al autor objetivo si el puntaje es superior a 7
            if (authorId_target && previousAverage <= 7 && roundedAverage > 7) {
                await prisma.user.update({
                    where: { id: authorId_target },
                    data: { reputation: { increment: 10 } },
                });
            }
        } else if (targetType === 'Image') {
            //========================================MONGODB======================================
            // const poi = await POI.findOne({ 'images._id': new mongoose.Types.ObjectId(targetId) });
            // if (poi) {
            //     const imageIndex = poi.images.findIndex(
            //         (img: { _id: mongoose.Types.ObjectId }) => img._id.toString() === targetId
            //     );
            //     if (imageIndex !== -1) {
            //         const previousAverage = poi.images[imageIndex].averageRating || 0;

            //         poi.images[imageIndex].ratings = totalRatings;
            //         poi.images[imageIndex].averageRating = roundedAverage;
            //         await poi.save();

            //         // Award +10 reputation points to author if average crossed above 7
            //         if (authorId && previousAverage <= 7 && roundedAverage > 7) {
            //             await User.findByIdAndUpdate(authorId, {
            //                 $inc: { reputation: 10 }
            //             });
            //         }
            //     }
            // }

            //================MYSQL========================
            // Encontramos la imagen previa junto con su anterior puntaje
            const previous = await prisma.image.findUnique({
                where: { id: id_number },
                select: { averageRating: true },
            });

            const previousAverage = previous?.averageRating ?? 0;

            // Actualizamos con el nuevo puntaje
            await prisma.image.update({
                where: { id: id_number },
                data: {
                    ratings: totalRatings,
                    averageRating: roundedAverage,
                },
            });

            // Si la valoración de la imagen ahora es mayor a 7, se le recompensa al creador
            if (authorId_target && previousAverage <= 7 && roundedAverage > 7) {
                await prisma.user.update({
                    where: { id: authorId_target },
                    data: { reputation: { increment: 10 } },
                });
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
