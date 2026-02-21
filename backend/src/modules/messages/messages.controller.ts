/**
 * Messages Controller
 * Handles message retrieval and creation
 * Refactored from inline routes in routes/index.js
 */

import { Request, Response, NextFunction } from 'express';

// Models will be imported from the models directory
const Notification = require('../../models/Notification');

export class MessagesController {
  /**
   * Get messages for user
   * GET /api/messages
   */
  static async getMessages(req: Request, res: Response, next: NextFunction) {
    try {
      // Get messages for user
      const db = require('../../config/database');
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

      const messages = result.rows.map((row: any) => ({
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
  }

  /**
   * Create a new message
   * POST /api/messages
   */
  static async createMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const { recipientId, content } = req.body;

      const db = require('../../config/database');
      const query = `
        INSERT INTO messages (sender_id, recipient_id, content)
        VALUES ($1, $2, $3)
        RETURNING *
      `;
      const result = await db.query(query, [req.user.id, recipientId, content]);

      // Create notification for recipient
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
  }
}
