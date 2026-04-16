import { Router } from 'express';
import { getNudge } from '../controllers/nudgeController.js';

const router = Router();

router.get('/', getNudge);

export default router;
