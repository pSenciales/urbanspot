import mongoose from 'mongoose';
import { ImageSchema } from './Image';

const POISchema = new mongoose.Schema({
    images: [ImageSchema],
}, { timestamps: true });

export default mongoose.models.POI || mongoose.model('POI', POISchema);