import { Request, Response } from 'express';
import { createFakeData } from '../fakeData/fakeData';

export const getProfile = (req: Request, res: Response) => {
  const { id } = req.params;
  const { users } = createFakeData()
  const user = users.find(u => u.id === id);
  if (user) {
    res.json(user); // Повертаємо об'єкт Profile
  } else {
    res.status(404).json({ message: 'Користувача не знайдено' });
  }
};