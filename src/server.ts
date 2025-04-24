import express, { NextFunction, Request, Response } from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import cors from 'cors';
import { ClientInfo, StoredMessage } from "./types/types";
import { createFakeData } from "./fakeData/fakeData";
import dialogsRoutes from './routes/dialogs.routes';
import profilesRoutes from './routes/profiles.routes';
import connectDB from "./config/db";
import Dialog from "./models/Dialog";
import Message from "./models/Message";
import uploadsRoutes from "./routes/uploads.routes";
import * as path from "node:path";
import fileUpload from "express-fileupload";

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });
connectDB().then(r => console.log('Connected to MongoDB'))
app.use(express.json())
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(fileUpload({
  createParentPath: true,
}));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

const clients = new Map<WebSocket, ClientInfo>();

wss.on('connection', ws => {
  const clientId = generateUniqueId();
  clients.set(ws, { id: clientId });
  console.log(`Клієнт підключився: ${clientId}`);

  ws.on('message', async message => {
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
        const { dialogId } = parsedMessage.payload;
        const storedMessage = new Message({ payload: parsedMessage.payload });
        await storedMessage.save();

        // Оновлюємо lastMessage для діалогу в БД
        const dialog = await Dialog.findById(dialogId);
        if (dialog) {
          dialog.lastMessage = { type: 'NEW_MESSAGE', payload: parsedMessage.payload };
          dialog.updatedAt = Date.now();
          await dialog.save();
        }

        broadcast({ type: 'NEW_MESSAGE', payload: storedMessage.payload }, ws);
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
app.use('/api/uploads', uploadsRoutes);

const PORT = 3000;

server.listen(PORT, () => {
  console.log(`Сервер запущено на порту ${PORT}`);
});

app.get('/', (req: Request, res: Response) => {
  res.send('Сервер чату працює!');
});