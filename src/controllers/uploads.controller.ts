import { Request, Response, RequestHandler } from 'express'; // Імпортуємо RequestHandler тут
import { UploadedFile } from 'express-fileupload';
import path from 'path';

// @ts-ignore
export const uploadFiles: RequestHandler = (req: Request, res: Response) => {
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).json({ message: 'Будь ласка, завантажте хоча б один файл.' });
  }

  const uploadedFiles = req.files;
  const fileUrls: string[] = [];
  const uploadDir = path.join(__dirname, '../../uploads');

  for (const key in uploadedFiles) {
    const file = uploadedFiles[key] as UploadedFile;
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = file.name.split('.').slice(0, -1).join('.') + '-' + uniqueSuffix + '.' + file.name.split('.').pop();
    const filePath = path.join(uploadDir, filename);

    file.mv(filePath, (err) => {
      if (err) {
        console.error('Помилка завантаження файлу:', err);
        return res.status(500).json({ message: `Не вдалося завантажити файл ${file.name}` });
      }
      fileUrls.push(`/uploads/${filename}`);
      if (fileUrls.length === Object.keys(uploadedFiles).length) {
        return res.status(200).json({ urls: fileUrls });
      }
    });
  }
};