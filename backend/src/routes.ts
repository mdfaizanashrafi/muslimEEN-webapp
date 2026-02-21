/**
 * Main Router Configuration
 * MuslimEEN Backend API Routes
 */

import { Router, Request, Response } from 'express';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import invitationRoutes from './routes/invitationRoutes';
import marketplaceRoutes from './routes/marketplaceRoutes';
import islamicFinanceRoutes from './routes/islamicFinanceRoutes';
import verificationRoutes from './routes/verificationRoutes';
import messagesRoutes from './routes/messagesRoutes';
import feedRoutes from './routes/feedRoutes';
import adminRoutes from './routes/adminRoutes';

const router = Router();

// API Info - Root route
router.get('/', (req: Request, res: Response) => {
  res.json({
    name: 'MuslimEEN API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      user: '/api/user',
      invitations: '/api/invitations',
      marketplace: '/api/marketplace',
      islamicFinance: '/api/islamic-finance',
      verification: '/api/verification',
      messages: '/api/messages',
      feed: '/api/feed',
      admin: '/api/admin'
    }
  });
});

// Mount module routes
router.use('/auth', authRoutes);
router.use('/user', userRoutes);
router.use('/invitations', invitationRoutes);
router.use('/marketplace', marketplaceRoutes);
router.use('/islamic-finance', islamicFinanceRoutes);
router.use('/verification', verificationRoutes);
router.use('/messages', messagesRoutes);
router.use('/feed', feedRoutes);
router.use('/admin', adminRoutes);

export default router;
