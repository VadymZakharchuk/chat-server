import express from 'express';
import { getProfile } from '../controllers/profiles.controller';

const router = express.Router();

router.get('/:id', getProfile);

export default router;