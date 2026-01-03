import mongoose from 'mongoose';
import { ImageSchema } from './Image';

const POISchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    tags: { type: [String], default: [] },
    location: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true },
    },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    ratings: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    images: [ImageSchema],
}, { timestamps: true });

export default mongoose.models.POI || mongoose.model('POI', POISchema);