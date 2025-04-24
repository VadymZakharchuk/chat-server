export interface ClientInfo {
  id: string;
  username?: string;
}

export interface MessagePayload {
  id: string;
  dialogId: string;
  senderId: string;
  createdAt: number;
  type: 'text' | 'image' | 'video';
  content?: string;
  imageUrl?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  duration?: number;
}

export interface StoredMessage {
  type: 'NEW_MESSAGE';
  payload: MessagePayload;
}

export interface DialogItem {
  id: string;
  participantIds: string[];
  lastMessage?: StoredMessage;
  updatedAt: number;
}

export interface Profile {
  id: string;
  name: string;
  avatar: string;
}
