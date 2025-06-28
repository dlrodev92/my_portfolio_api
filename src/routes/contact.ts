import { Router } from 'express';
import { submitContactForm } from '../controllers/contactController';

const router = Router();

// Public route - send email
router.post('/', submitContactForm);

export default router;