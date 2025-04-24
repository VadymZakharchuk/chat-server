import mongoose, { Schema, Document } from 'mongoose';
import { StoredMessage } from '../types/types';

export interface DialogDocument extends Document {
  participantIds: string[];
  lastMessage?: StoredMessage;
  updatedAt: number;
}

const DialogSchema: Schema = new Schema({
  participantIds: { type: [String], required: true },
  lastMessage: {
    type: {
      type: { type: String, enum: ['NEW_MESSAGE'], required: true },
      payload: {
        id: String,
        dialogId: String,
        senderId: String,
        content: String,
        imageUrl: String,
        videoUrl: String,
        fileUrl: String,
        fileName: String,
        createdAt: Number,
        type: { type: String, enum: ['text', 'image', 'video', 'file'], default: 'text' },
      },
    },
    _id: false,
  },
  updatedAt: { type: Number, default: Date.now },
}, { timestamps: false, versionKey: false });

export default mongoose.model<DialogDocument>('Dialog', DialogSchema);