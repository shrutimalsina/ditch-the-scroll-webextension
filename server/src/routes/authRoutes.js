import { Router } from 'express';
import { syncUser } from '../controllers/authController.js';

const router = Router();

router.post('/sync-user', syncUser);

export default router;
