import { Router } from 'express';
import { analyzeProgress } from '../controllers/aiCoachController';
import { changePassword, deleteAccount, login, signup, updateProfile } from '../controllers/authController';

const router = Router();

router.post('/login', login);
router.post('/signup', signup);
router.post('/update-profile', updateProfile);
router.post('/change-password', changePassword);
router.post('/delete-account', deleteAccount);
router.post('/ai-coach/analyze', analyzeProgress);

export default router;
