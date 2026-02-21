/**
 * Admin Routes
 * MuslimEEN Backend
 */

import { Router } from 'express';
import { AdminController } from './admin.controller';

// Middleware will be imported from middleware directory
const { authenticate, authorize } = require('../../middleware/auth');

const router = Router();

// GET /api/admin/stats - Admin dashboard stats
router.get('/stats', authenticate, authorize('admin'), AdminController.getStats);

export default router;
