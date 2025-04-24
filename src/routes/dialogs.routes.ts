import express from 'express';
import {
  getDialogMessages,
  getDialogs,
} from '../controllers/dialogs.controller';

const router = express.Router();

router.get('/:dialogId/messages', getDialogMessages);
router.get('/', getDialogs);

export default router;