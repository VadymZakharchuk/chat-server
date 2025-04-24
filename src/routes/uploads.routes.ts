import express from 'express';
import type { RequestHandler } from 'express';
import { uploadFiles } from '../controllers/uploads.controller';

const router = express.Router();
const uploadFilesHandler: RequestHandler = uploadFiles
router.post('/', uploadFilesHandler); // Загальний маршрут для завантаження файлів

export default router;