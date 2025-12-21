import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    name: String,
    email: { type: String, required: true },
    provider: { type: String, required: true },
    points: { type: Number, required: true, default: 0 },
}, { timestamps: true });

export default mongoose.models.User || mongoose.model('User', UserSchema);