import mongoose, { Schema, Document } from 'mongoose';
import { Profile } from '../types/types';

export interface UserDocument extends Document {
  id: string; // Явно вказуємо, що id має бути string
}

const UserSchema: Schema = new Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  avatar: String,
}, { timestamps: false, versionKey: false });

interface UserModel extends mongoose.Model<UserDocument> {}
export default mongoose.model<UserDocument, UserModel>('User', UserSchema);