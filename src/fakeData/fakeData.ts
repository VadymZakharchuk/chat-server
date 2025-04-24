import { DialogItem, Profile, StoredMessage } from "../types/types";

export const createFakeData = (): {
  users: Profile[],
  dialogs: Map<string, DialogItem>,
  dialogMessages: Map<string, StoredMessage[]>
} => {
  const dialogs = new Map<string, DialogItem>();

// Тимчасове зберігання повідомлень у пам'яті
  const dialogMessages = new Map<string, StoredMessage[]>();

// Тестові користувачі
  const users: Profile[] = [
    {id: 'user1', name: 'Alice', avatar: 'https://i.pravatar.cc/150?u=bob'},
    {id: 'user2', name: 'Bob', avatar: 'https://i.pravatar.cc/150?u=alice'},
  ];

  function generateUniqueId(): string {
    return Math.random().toString(36).substring(2, 15);
  }

// Функція для створення тимчасових діалогів
  function createTempDialog(id: string, participantIds: string[]) {
    dialogs.set(id, {
      id,
      participantIds,
      lastMessage: undefined,
      updatedAt: Date.now(),
    });
  }

// Функція для додавання тестових повідомлень
  function addTempMessage(dialogId: string, senderId: string, content: string, createdAt: number) {
    const message: StoredMessage = {
      type: 'NEW_MESSAGE',
      payload: {
        id: generateUniqueId(),
        dialogId: dialogId,
        senderId: senderId,
        createdAt: createdAt,
        type: 'text',
        content: content,
      },
    };
    const messages = dialogMessages.get(dialogId) || [];
    messages.push(message);
    dialogMessages.set(dialogId, messages);
    const dialog = dialogs.get(dialogId);
    if (dialog) {
      dialog.lastMessage = message;
      dialog.updatedAt = createdAt;
    }
  }

  createTempDialog('past_dialog_1', ['user1', 'user2']);
  addTempMessage('past_dialog_1', 'user1', 'Привіт, Боб!', Date.now() - 60000);
  addTempMessage('past_dialog_1', 'user2', 'Привіт, Алісо!', Date.now() - 55000);

  createTempDialog('past_dialog_2', ['user1', 'user2']);
  addTempMessage('past_dialog_2', 'user1', 'Як твої справи?', Date.now() - 30000);
  addTempMessage('past_dialog_2', 'user2', 'Все добре, дякую!', Date.now() - 25000);

  createTempDialog('current_dialog_1', ['user1']);
  createTempDialog('current_dialog_2', ['user2']);

  return {users: users, dialogs: dialogs, dialogMessages: dialogMessages }
}