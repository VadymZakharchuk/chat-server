import { Request, Response } from 'express';
import { createFakeData } from "../fakeData/fakeData"

export const getDialogMessages = (req: Request, res: Response) => {
  const { dialogId } = req.params;
  const { dialogMessages } = createFakeData()
  const messages = dialogMessages.get(dialogId) || [];
  res.json({
    items: messages,
    total: messages.length,
    offset: 0,
    hasMore: false,
  });
};

export const getDialogs = (req: Request, res: Response) => {
  const { dialogs } = createFakeData()
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
};