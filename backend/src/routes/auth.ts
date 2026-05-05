import { Router } from 'express';
import { loginUser, loginWithGoogle, signupUser } from '../controllers/auth.js'; 

const router = Router();

router.post('/signup', signupUser);
router.post('/login', loginUser);
router.post('/google', loginWithGoogle);

export default router;
