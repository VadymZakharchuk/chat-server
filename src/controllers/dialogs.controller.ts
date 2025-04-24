import { Request, Response } from 'express';
import Message from '../models/Message';
import Dialog from '../models/Dialog';

export const getDialogMessages = async (req: Request, res: Response) => {
  const { dialogId } = req.params;
  const { offset = 0, limit = 20 } = req.query;
  const offsetNum = parseInt(offset as string, 10) || 0;
  const limitNum = Math.min(parseInt(limit as string, 10) || 20, 100);

  try {
    const messages = await Message.find({ 'payload.dialogId': dialogId })
      .sort({ 'payload.createdAt': -1 }) // Сортуємо від нових до старих
      .skip(offsetNum)
      .limit(limitNum);

    const total = await Message.countDocuments({ 'payload.dialogId': dialogId });
    const hasMore = offsetNum + limitNum < total;

    res.json({
      items: messages.reverse(), // Повертаємо у хронологічному порядку
      total,
      offset: offsetNum,
      hasMore,
    });
  } catch (error: any) {
    console.error('Помилка отримання повідомлень діалогу:', error);
    res.status(500).json({ message: 'Не вдалося отримати повідомлення діалогу' });
  }
};

export const getDialogs = async (req: Request, res: Response) => {
  const { offset = 0, limit = 10, participantId } = req.query;
  const offsetNum = parseInt(offset as string, 10) || 0;
  const limitNum = Math.min(parseInt(limit as string, 10) || 10, 50);

  const query = participantId ? { participantIds: participantId } : {};

  try {
    const dialogs = await Dialog.find(query)
      .sort({ updatedAt: -1 })
      .skip(offsetNum)
      .limit(limitNum);

    const total = await Dialog.countDocuments(query);
    const hasMore = offsetNum + limitNum < total;

    res.json({
      items: dialogs,
      total,
      offset: offsetNum,
      hasMore,
    });
  } catch (error: any) {
    console.error('Помилка отримання списку діалогів:', error);
    res.status(500).json({ message: 'Не вдалося отримати список діалогів' });
  }
};