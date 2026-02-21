/**
 * Messages Routes
 * MuslimEEN Backend
 */

import { Router } from 'express';
import { MessagesController } from './messages.controller';

// Middleware will be imported from middleware directory
const { authenticate } = require('../../middleware/auth');
const { messageLimiter } = require('../../middleware/rateLimiter');

const router = Router();

// GET /api/messages - Get messages for user
router.get('/', authenticate, messageLimiter, MessagesController.getMessages);

// POST /api/messages - Create a new message
router.post('/', authenticate, messageLimiter, MessagesController.createMessage);

export default router;
