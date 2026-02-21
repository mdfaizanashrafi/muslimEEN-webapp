/**
 * Feed Controller
 * Handles feed aggregation and retrieval
 * Refactored from inline route in routes/index.js
 */

import { Request, Response, NextFunction } from 'express';

export class FeedController {
  /**
   * Get feed items
   * GET /api/feed
   */
  static async getFeed(req: Request, res: Response, next: NextFunction) {
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
  }
}
