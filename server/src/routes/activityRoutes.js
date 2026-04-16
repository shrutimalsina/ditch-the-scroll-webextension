import { Router } from 'express';
import { upsertActivity } from '../controllers/activityController.js';

const router = Router();

router.post('/', upsertActivity);

export default router;
