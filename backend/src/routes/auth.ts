import { Router } from 'express';
import { loginUser, loginWithGoogle, signupUser } from '../controllers/auth.js'; 
import { authLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.post('/signup', authLimiter, signupUser);
router.post('/login', authLimiter, loginUser);
router.post('/google', authLimiter, loginWithGoogle);

export default router;
