import mongoose, { Schema, Document } from 'mongoose';
import { MessagePayload } from '../types/types';

export interface MessageDocument extends Document {
  payload: MessagePayload;
}

const MessageSchema: Schema = new Schema({
  payload: {
    id: String,
    dialogId: { type: String, required: true },
    senderId: { type: String, required: true },
    content: String,
    imageUrl: String,
    videoUrl: String,
    fileUrl: String,
    fileName: String,
    createdAt: { type: Number, default: Date.now },
    type: { type: String, enum: ['text', 'image', 'video', 'file'], default: 'text' },
  },
}, { timestamps: false, versionKey: false });

export default mongoose.model<MessageDocument>('Message', MessageSchema);