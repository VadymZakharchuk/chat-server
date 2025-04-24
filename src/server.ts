import express, { NextFunction, Request, Response } from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import cors from 'cors';
import { ClientInfo, DialogItem, Profile, StoredMessage } from "./types/types";
import { createFakeData } from "./fakeData/fakeData";
import dialogsRoutes from './routes/dialogs.routes';
import profilesRoutes from './routes/profiles.routes';

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

const { users, dialogs, dialogMessages } = createFakeData();

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

// Підключаємо роутери
app.use('/api/dialogs', dialogsRoutes);
app.use('/api/profiles', profilesRoutes);

const PORT = 3000;

server.listen(PORT, () => {
  console.log(`Сервер запущено на порту ${PORT}`);
});

app.get('/', (req: Request, res: Response) => {
  res.send('Сервер чату працює!');
});