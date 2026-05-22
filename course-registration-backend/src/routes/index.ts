import { Router } from 'express';
import { handleChat } from '../controllers/chat.controller';
import { login } from '../controllers/auth.controller';
import { verifyToken } from '../middlewares/auth.middleware';
const router = Router();

// check health
router.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'AI course registration Backend is running' });
});

router.post('/login', login);


router.post('/chat', verifyToken, handleChat);

export default router;