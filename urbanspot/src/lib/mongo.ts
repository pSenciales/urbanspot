// // src/lib/mongo.ts
// import mongoose from 'mongoose';

// export default async function dbConnect() {
//     const MONGODB_URI = process.env.MONGODB_URI;

//     if (!MONGODB_URI) {
//         throw new Error('Please define the MONGODB_URI environment variable');
//     }

//     if (mongoose.connection.readyState >= 1) {
//         return mongoose;
//     }

//     return await mongoose.connect(MONGODB_URI);
// }