/**
 * API Routes
 * MuslimEEN Backend API Routes
 */

const express = require('express');
const router = express.Router();

// Middleware
const { authenticate, optionalAuth, authorize } = require('../middleware/auth');
const { validate, validateQuery } = require('../middleware/validation');
const {
  authLimiter,
  userLimiter,
  marketplaceLimiter,
  messageLimiter,
  apiLimiter
} = require('../middleware/rateLimiter');

// Controllers
const authController = require('../controllers/authController');
const userController = require('../controllers/userController');
const marketplaceController = require('../controllers/marketplaceController');
const islamicFinanceController = require('../controllers/islamicFinanceController');
const verificationController = require('../controllers/verificationController');
const invitationController = require('../controllers/invitationController');

// ============================================================================
// Public Routes
// ============================================================================

// API Info
router.get('/', (req, res) => {
  res.json({
    name: 'MuslimEEN API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      user: '/api/user',
      marketplace: '/api/marketplace',
      islamicFinance: '/api/islamic-finance',
      verification: '/api/verification',
      invitations: '/api/invitations'
    }
  });
});

// ============================================================================
// Authentication Routes
// ============================================================================

router.post('/auth/validate-invitation', authLimiter, validate('validateInvitation'), authController.validateInvitation);
router.post('/auth/login', authLimiter, validate('login'), authController.login);
router.post('/auth/register', authLimiter, validate('register'), authController.register);
router.post('/auth/logout', authenticate, authController.logout);
router.get('/auth/me', authenticate, authController.getCurrentUser);

// ============================================================================
// User Routes
// ============================================================================

router.get('/user/profile', authenticate, userLimiter, userController.getProfile);
router.put('/user/profile', authenticate, userLimiter, validate('updateProfile'), userController.updateProfile);

// Trust Score
router.get('/user/trust-score', authenticate, userLimiter, userController.getTrustScore);
router.get('/user/trust-score/history', authenticate, userLimiter, userController.getTrustScoreHistory);

// Connections
router.get('/user/connections', authenticate, userLimiter, userController.getConnections);
router.get('/user/connections/pending', authenticate, userLimiter, userController.getPendingConnections);
router.post('/user/connections', authenticate, userLimiter, validate('connectionRequest'), userController.sendConnectionRequest);
router.post('/user/connections/:id/accept', authenticate, userLimiter, userController.acceptConnectionRequest);
router.post('/user/connections/:id/reject', authenticate, userLimiter, userController.rejectConnectionRequest);

// Notifications
router.get('/user/notifications', authenticate, userLimiter, userController.getNotifications);
router.put('/user/notifications/:id/read', authenticate, userLimiter, userController.markNotificationRead);
router.put('/user/notifications/read-all', authenticate, userLimiter, userController.markAllNotificationsRead);

// ============================================================================
// Invitation Routes
// ============================================================================

router.get('/invitations', authenticate, userLimiter, invitationController.getInvitations);
router.post('/invitations', authenticate, userLimiter, invitationController.createInvitation);
router.delete('/invitations/:id', authenticate, userLimiter, invitationController.revokeInvitation);
router.get('/invitations/remaining', authenticate, userLimiter, invitationController.getRemainingCount);
router.get('/invitations/validate/:code', authLimiter, invitationController.validateInvitation);

// ============================================================================
// Marketplace Routes
// ============================================================================

router.get('/marketplace/:vertical', authenticate, marketplaceLimiter, validateQuery('marketplaceFilter'), marketplaceController.getItems);
router.get('/marketplace/:vertical/:id', authenticate, marketplaceLimiter, marketplaceController.getItem);
router.post('/marketplace/:vertical', authenticate, marketplaceLimiter, validate('createMarketplaceItem'), marketplaceController.createItem);
router.put('/marketplace/:vertical/:id', authenticate, marketplaceLimiter, marketplaceController.updateItem);
router.delete('/marketplace/:vertical/:id', authenticate, marketplaceLimiter, marketplaceController.deleteItem);

// Investment (BUILD vertical only)
router.post('/marketplace/build/:id/invest', authenticate, marketplaceLimiter, marketplaceController.invest);

// ============================================================================
// Islamic Finance Routes
// ============================================================================

// Sadaqah (Charity)
router.get('/islamic-finance/sadaqah', authenticate, apiLimiter, islamicFinanceController.getSadaqahCampaigns);
router.get('/islamic-finance/sadaqah/:id', authenticate, apiLimiter, islamicFinanceController.getSadaqahCampaign);
router.post('/islamic-finance/sadaqah/:id/donate', authenticate, apiLimiter, validate('donation'), islamicFinanceController.donate);

// Waqf
router.get('/islamic-finance/waqf', authenticate, apiLimiter, islamicFinanceController.getWaqf);

// Qard Hasan
router.get('/islamic-finance/qardhasan', authenticate, apiLimiter, islamicFinanceController.getQardHasanLoans);
router.post('/islamic-finance/qardhasan', authenticate, apiLimiter, validate('qardHasanLoan'), islamicFinanceController.createQardHasanLoan);
router.post('/islamic-finance/qardhasan/:id/lend', authenticate, apiLimiter, islamicFinanceController.lendToQardHasan);
router.post('/islamic-finance/qardhasan/:id/repay', authenticate, apiLimiter, islamicFinanceController.repayQardHasan);

// Zakat Calculator
router.post('/islamic-finance/zakat/calculate', authenticate, apiLimiter, validate('zakatCalculation'), islamicFinanceController.calculateZakat);

// ============================================================================
// Verification Routes
// ============================================================================

router.get('/verification/status', authenticate, userController.getTrustScore);

// Biometric
router.post('/verification/biometric/request', authenticate, userLimiter, verificationController.requestBiometricVerification);
router.post('/verification/biometric/complete', authenticate, userLimiter, verificationController.completeBiometricVerification);

// Two-Witness
router.post('/verification/witness/request', authenticate, userLimiter, verificationController.requestWitnessVerification);
router.post('/verification/witness/approve', authenticate, userLimiter, verificationController.approveWitness);

// Business
router.post('/verification/business/request', authenticate, userLimiter, verificationController.requestBusinessVerification);
router.post('/verification/business/approve', authenticate, authorize('admin'), verificationController.approveBusinessVerification);

// ============================================================================
// Feed Route
// ============================================================================

router.get('/feed', authenticate, apiLimiter, async (req, res, next) => {
  try {
    // This would typically aggregate from multiple sources
    // For now, return mock data
    const feedItems = [
      {
        id: 'feed_001',
        type: 'job_posting',
        author: {
          id: 'usr_007',
          name: 'Islamic Bank of Britain',
          trustScore: 950,
          verified: true
        },
        title: 'Senior Islamic Finance Analyst',
        content: 'We are seeking an experienced Islamic Finance Analyst...',
        location: 'London, UK',
        salary: '£60,000 - £80,000',
        postedAt: new Date().toISOString(),
        likes: 24,
        comments: 8
      }
    ];

    res.json({
      success: true,
      items: feedItems
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// Messages Routes
// ============================================================================

router.get('/messages', authenticate, messageLimiter, async (req, res, next) => {
  try {
    // Get messages for user
    const db = require('../config/database');
    const query = `
      SELECT m.*, 
        u.first_name as sender_first_name, 
        u.last_name as sender_last_name,
        u.trust_score as sender_trust_score
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.recipient_id = $1
      ORDER BY m.created_at DESC
      LIMIT 50
    `;
    const result = await db.query(query, [req.user.id]);

    const messages = result.rows.map(row => ({
      id: row.id,
      sender: {
        id: row.sender_id,
        name: `${row.sender_first_name} ${row.sender_last_name}`,
        trustScore: row.sender_trust_score
      },
      content: row.content,
      read: row.read,
      createdAt: row.created_at
    }));

    res.json({
      success: true,
      messages
    });
  } catch (error) {
    next(error);
  }
});

router.post('/messages', authenticate, messageLimiter, async (req, res, next) => {
  try {
    const { recipientId, content } = req.body;

    const db = require('../config/database');
    const query = `
      INSERT INTO messages (sender_id, recipient_id, content)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const result = await db.query(query, [req.user.id, recipientId, content]);

    // Create notification for recipient
    const Notification = require('../models/Notification');
    await Notification.create({
      userId: recipientId,
      type: Notification.TYPES.MESSAGE_RECEIVED,
      title: 'New Message',
      message: `You have a new message from ${req.user.fullName}`,
      actorId: req.user.id,
      actorName: req.user.fullName,
      actorTrustScore: req.user.trustScore,
      actionUrl: '/messages'
    });

    res.status(201).json({
      success: true,
      message: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// Admin Routes
// ============================================================================

// Admin dashboard stats
router.get('/admin/stats', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const db = require('../config/database');

    const stats = await Promise.all([
      db.query('SELECT COUNT(*) as total FROM users'),
      db.query("SELECT COUNT(*) as verified FROM users WHERE verification_tier != 'basic'"),
      db.query('SELECT COUNT(*) as pending FROM invitations WHERE status = $1', ['pending']),
      db.query('SELECT AVG(trust_score) as avg_trust FROM users')
    ]);

    res.json({
      success: true,
      stats: {
        totalUsers: parseInt(stats[0].rows[0].total),
        verifiedUsers: parseInt(stats[1].rows[0].verified),
        pendingInvitations: parseInt(stats[2].rows[0].pending),
        averageTrustScore: Math.round(stats[3].rows[0].avg_trust || 0)
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
