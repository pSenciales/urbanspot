// import mongoose from 'mongoose';

// const RatingSchema = new mongoose.Schema({
//     user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
//     targetType: { type: String, enum: ['POI', 'Image'], required: true },
//     targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
//     poiId: { type: mongoose.Schema.Types.ObjectId, ref: 'POI' }, // For images, reference the parent POI
//     score: { type: Number, required: true, min: 0, max: 10 },
// }, { timestamps: true });

// // Unique index to prevent double voting
// RatingSchema.index({ user: 1, targetType: 1, targetId: 1 }, { unique: true });

// export default mongoose.models.Rating || mongoose.model('Rating', RatingSchema);
