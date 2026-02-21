/**
 * Admin Controller
 * Handles admin dashboard and statistics
 * Refactored from inline route in routes/index.js
 */

import { Request, Response, NextFunction } from 'express';

export class AdminController {
  /**
   * Get admin dashboard stats
   * GET /api/admin/stats
   */
  static async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const db = require('../../config/database');

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
  }
}
