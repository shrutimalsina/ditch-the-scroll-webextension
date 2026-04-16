import { Router } from 'express';
import { registerPushToken, sendNudgePush } from '../controllers/pushController.js';

const router = Router();

router.post('/register', registerPushToken);
router.post('/send-nudge', sendNudgePush);

export default router;
