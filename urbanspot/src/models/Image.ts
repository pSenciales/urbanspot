import mongoose from 'mongoose';

export const ImageSchema = new mongoose.Schema({
    url: { type: String, required: true },
    metadata: { type: Object, required: true },
}, { timestamps: true });

const Image = mongoose.models.Image || mongoose.model('Image', ImageSchema);
export default Image;