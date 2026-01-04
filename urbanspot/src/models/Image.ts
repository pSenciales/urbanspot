import mongoose from 'mongoose';

export const ImageSchema = new mongoose.Schema({
    url: { type: String, required: true },
    metadata: { type: Object, required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    ratings: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
}, { timestamps: true });

const Image = mongoose.models.Image || mongoose.model('Image', ImageSchema);
export default Image;