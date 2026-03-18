/**
 * Feedback Collection Routes
 * Capture and store user feedback during beta
 */

import { Router, Request, Response } from 'express';
import { authenticate } from '../iam/middleware/auth';
import { logger } from '../shared/utils/logger';
import pool from '../database/pool';

const router = Router();

// POST /api/feedback - Submit user feedback
router.post('/', authenticate, async (req: Request, res: Response) => {
  try {
    const { rating, feedback, context, url } = req.body;
    const userId = req.user?.id;

    // Validate input
    if (!rating && !feedback) {
      res.status(400).json({ success: false, error: { code: 'MISSING_DATA', message: 'Rating or feedback is required' } });
      return;
    }

    if (rating && (rating < 1 || rating > 5)) {
      res.status(400).json({ success: false, error: { code: 'INVALID_RATING', message: 'Rating must be between 1 and 5' } });
      return;
    }

    // Store feedback
    await pool.query(
      `INSERT INTO user_feedback (user_id, rating, feedback, context, url, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [userId, rating, feedback, context, url]
    );

    logger.info('Feedback submitted', { userId, rating, context });

    res.json({ success: true, message: 'Feedback recorded' });
  } catch (error) {
    logger.error('Failed to record feedback', { error: (error as Error).message });
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to record feedback' } });
  }
});

// GET /api/feedback - Get all feedback (admin only)
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT f.*, u.email as user_email
       FROM user_feedback f
       LEFT JOIN users u ON f.user_id = u.id
       ORDER BY f.created_at DESC
       LIMIT 100`
    );

    res.json({ success: true, feedback: result.rows });
  } catch (error) {
    logger.error('Failed to fetch feedback', { error: (error as Error).message });
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch feedback' } });
  }
});

// GET /api/feedback/stats - Get feedback statistics
router.get('/stats', authenticate, async (req: Request, res: Response) => {
  try {
    const stats = await pool.query(
      `SELECT 
        COUNT(*) as total_feedback,
        AVG(rating) as avg_rating,
        COUNT(CASE WHEN rating = 5 THEN 1 END) as five_star,
        COUNT(CASE WHEN rating = 4 THEN 1 END) as four_star,
        COUNT(CASE WHEN rating = 3 THEN 1 END) as three_star,
        COUNT(CASE WHEN rating = 2 THEN 1 END) as two_star,
        COUNT(CASE WHEN rating = 1 THEN 1 END) as one_star
       FROM user_feedback
       WHERE created_at > NOW() - INTERVAL '30 days'`
    );

    res.json({ success: true, stats: stats.rows[0] });
  } catch (error) {
    logger.error('Failed to fetch feedback stats', { error: (error as Error).message });
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch stats' } });
  }
});

export default router;
