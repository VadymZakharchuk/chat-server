import express, {NextFunction, Request, Response} from 'express';
import type {RequestHandler} from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import cors from 'cors';

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'
  ], // додайте ваші дозволені origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

interface ClientInfo {
  id: string;
  username?: string;
}

interface MessagePayload {
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

interface StoredMessage {
  type: 'NEW_MESSAGE';
  payload: MessagePayload;
}

interface DialogItem {
  id: string;
  participantIds: string[];
  lastMessage?: StoredMessage;
  updatedAt: number;
}

interface Profile {
  id: string;
  name: string;
  avatar: string;
}

// Тимчасове зберігання діалогів у пам'яті
const dialogs = new Map<string, DialogItem>();

// Тимчасове зберігання повідомлень у пам'яті
const dialogMessages = new Map<string, StoredMessage[]>();

// Тестові користувачі
const users: Profile[] = [
  { id: 'user1', name: 'Alice', avatar: 'https://i.pravatar.cc/150?u=bob' },
  { id: 'user2', name: 'Bob', avatar: 'https://i.pravatar.cc/150?u=alice' },
];

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

// Створення тестових діалогів та повідомлень при запуску сервера
createTempDialog('past_dialog_1', ['user1', 'user2']);
addTempMessage('past_dialog_1', 'user1', 'Привіт, Боб!', Date.now() - 60000);
addTempMessage('past_dialog_1', 'user2', 'Привіт, Алісо!', Date.now() - 55000);

createTempDialog('past_dialog_2', ['user1', 'user2']);
addTempMessage('past_dialog_2', 'user1', 'Як твої справи?', Date.now() - 30000);
addTempMessage('past_dialog_2', 'user2', 'Все добре, дякую!', Date.now() - 25000);

createTempDialog('current_dialog_1', ['user1']);
createTempDialog('current_dialog_2', ['user2']);

const clients = new Map<WebSocket, ClientInfo>();

wss.on('connection', ws => {
  const clientId = generateUniqueId();
  clients.set(ws, { id: clientId });
  console.log(`Клієнт підключився: ${clientId}`);

  ws.on('message', message => {
    try {
      const parsedMessage = JSON.parse(message.toString());
      console.log('Отримано повідомлення:', parsedMessage);

      if (parsedMessage.type === 'join' && parsedMessage.username) {
        const clientInfo = clients.get(ws);
        if (clientInfo) {
          clientInfo.username = parsedMessage.username;
        }
        broadcast({ type: 'system', message: `${parsedMessage.username} приєднався до чату.` }, ws);
      } else if (parsedMessage.type === 'NEW_MESSAGE' &&
        parsedMessage.payload && parsedMessage.payload.dialogId &&
        parsedMessage.payload.senderId && parsedMessage.payload.content) {
        const dialogId = parsedMessage.payload.dialogId;
        const storedMessage: StoredMessage = {
          type: 'NEW_MESSAGE',
          payload: { ...parsedMessage.payload },
        };

        // Оновлюємо lastMessage для діалогу
        const dialog = dialogs.get(dialogId);
        if (dialog) {
          dialog.lastMessage = storedMessage;
          dialog.updatedAt = Date.now();
        }

        // Зберігаємо повідомлення в пам'яті
        const messagesForDialog = dialogMessages.get(dialogId) || [];
        messagesForDialog.push(storedMessage);
        dialogMessages.set(dialogId, messagesForDialog);

        // Розсилаємо повідомлення всім клієнтам
        broadcast(storedMessage, ws);
      }
    } catch (error) {
      console.error('Помилка обробки повідомлення:', error);
    }
  });

  ws.on('close', () => {
    const clientInfo = clients.get(ws);
    if (clientInfo && clientInfo.username) {
      broadcast({ type: 'system', message: `${clientInfo.username} покинув чат.` }, ws);
    }
    clients.delete(ws);
    console.log(`Клієнт відключився: ${clientInfo ? clientInfo.id || 'невідомо' : 'невідомо'}`);
  });

  ws.on('error', error => {
    console.error(`Помилка WebSocket для клієнта ${clients.get(ws)}:`, error);
    clients.delete(ws);
  });
});

function broadcast(message: any, sender?: WebSocket) {
  const messageString = JSON.stringify(message);
  clients.forEach((clientInfo, client) => {
    if (client !== sender && client.readyState === WebSocket.OPEN) {
      client.send(messageString);
    }
  });
}

function generateUniqueId(): string {
  return Math.random().toString(36).substring(2, 15);
}

// Ендпоінт для отримання історії повідомлень діалогу
app.get('/api/dialogs/:dialogId/messages', (req: Request, res: Response) => {
  const { dialogId } = req.params;
  const messages = dialogMessages.get(dialogId) || [];
  res.json({
    items: messages,
    total: messages.length,
    offset: 0,
    hasMore: false,
  });
});

// Ендпоінт для отримання списку діалогів
app.get('/api/dialogs', (req: Request, res: Response) => {
  const { offset = 0, limit = 10, participantId } = req.query;
  const offsetNum = parseInt(offset as string, 10) || 0;
  const limitNum = Math.min(parseInt(limit as string, 10) || 10, 50);

  let filteredDialogs = Array.from(dialogs.values());

  if (participantId) {
    filteredDialogs = filteredDialogs.filter(dialog => dialog.participantIds.includes(participantId as string));
  }

  const total = filteredDialogs.length;
  const items = filteredDialogs.slice(offsetNum, offsetNum + limitNum);
  const hasMore = offsetNum + limitNum < total;

  res.json({
    items,
    total,
    offset: offsetNum,
    hasMore,
  });
});

// Ендпоінт для отримання профілю користувача
app.get('/api/profiles/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const user = users.find(u => u.id === id);
  if (user) {
    res.json(user); // Повертаємо об'єкт Profile
  } else {
    res.status(404).json({ message: 'Користувача не знайдено' });
  }
});


const PORT = 3000;

server.listen(PORT, () => {
  console.log(`Сервер запущено на порту ${PORT}`);
});

app.get('/', (req: Request, res: Response) => {
  res.send('Сервер чату працює!');
});