/**
 * Feed Routes
 * MuslimEEN Backend
 */

import { Router } from 'express';
import { FeedController } from './feed.controller';

// Middleware will be imported from middleware directory
const { authenticate } = require('../../middleware/auth');
const { apiLimiter } = require('../../middleware/rateLimiter');

const router = Router();

// GET /api/feed - Get feed items
router.get('/', authenticate, apiLimiter, FeedController.getFeed);

export default router;
